// The background brain: a few hundred neurons sampled inside a side-view brain silhouette, given
// depth so the two hemispheres turn in 3D, and wired to their nearest neighbours. Signals travel
// along the wires and set off the next neuron. The cursor is a neuron too: nearby cells reach out
// to it and fire. No libraries; one canvas. app.js steers it with Brain.setTarget().
(() => {
  const canvas = document.getElementById("brain");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const lerp = (a, b, k) => a + (b - a) * k;

  // ── Silhouette, in a 200×150 box (front of the brain on the left), as cubic segments so the same
  // data both tests "inside?" and gets traced as an outline.
  const START = [28, 92];
  const SEGS = [
    [[12, 70], [22, 30], [60, 20]], [[85, 5], [135, 5], [160, 25]], [[185, 42], [192, 70], [180, 92]],
    [[172, 104], [160, 108], [148, 106]], [[136, 104], [124, 100], [112, 104]], [[96, 112], [74, 114], [60, 106]],
    [[48, 100], [38, 100], [28, 92]],
  ];
  const cerebrum = new Path2D(`M${START} ` + SEGS.map((s) => "C" + s.map((p) => p.join(" ")).join(" ")).join(" ") + "Z");
  const cerebellum = new Path2D();
  cerebellum.ellipse(152, 114, 27, 14, -0.12, 0, Math.PI * 2);
  const stem = new Path2D("M124 104 L142 104 L140 146 L128 146Z");
  const probe = document.createElement("canvas").getContext("2d");
  const inCerebrum = (x, y) => probe.isPointInPath(cerebrum, x, y);
  const BX = 105, BY = 78, BS = 92; // box centre and half-size → normalised coords

  const bez = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
  };
  // Outline as a dense polyline, then resampled to even spacing.
  const outline = (() => {
    const raw = [];
    let p0 = START;
    for (const [a, b, c] of SEGS) { for (let i = 0; i < 40; i++) raw.push(bez(p0, a, b, c, i / 40)); p0 = c; }
    return raw;
  })();
  const resample = (pts, step, closed) => {
    const out = [pts[0]];
    let acc = 0;
    const n = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      acc += d;
      if (acc >= step) { out.push(b); acc = 0; }
    }
    return out;
  };

  // Brain regions, used to light up a part of the brain for each step of the loop.
  const regionOf = (x, y, part) => {
    if (part === 1) return 4;              // cerebellum
    if (x < 70) return 0;                  // frontal
    if (x > 150) return 3;                 // occipital
    if (y < 52) return 1;                  // parietal
    return 2;                              // temporal
  };
  // Hemisphere depth at a point: an ellipsoid, so the outline sits near the midline and the middle bulges.
  const depth = (x, y) => {
    const nx = (x - 104) / 90, ny = (y - 60) / 58;
    return Math.sqrt(Math.max(0.03, 1 - nx * nx - ny * ny));
  };

  let nodes = [], edges = [], adj = [];
  const addNode = (x, y, z, part, minor) => {
    nodes.push({
      hx: (x - BX) / BS, hy: (y - BY) / BS, hz: z, part, region: regionOf(x, y, part), minor,
      ph: rand(0, Math.PI * 2), sp: rand(0.4, 1.1), act: 0, sx: 0, sy: 0, sd: 1, dx: 0, dy: 0,
    });
    adj.push([]);
    return nodes.length - 1;
  };
  const link = (i, j, chain) => { edges.push([i, j, chain ? 1 : 0]); adj[i].push(j); adj[j].push(i); };
  // A chain of cells along a curve: these trace the outline and the folds, and signals run along them.
  const chain = (pts, zf, part, closed) => {
    let prev = -1, first = -1;
    for (const [x, y] of pts) {
      const i = addNode(x, y, zf(x, y), part, true);
      if (prev >= 0) link(prev, i, true); else first = i;
      prev = i;
    }
    if (closed && first >= 0 && prev !== first) link(prev, first, true);
  };

  const build = () => {
    const small = innerWidth < 700;
    nodes = []; edges = []; adj = [];
    const step = small ? 6 : 4.2;

    for (const side of [-1, 1]) {
      const zs = (k) => (x, y) => side * (0.04 + k * depth(x, y));
      // Outline of each hemisphere.
      chain(resample(outline, step, true), zs(0.12), 0, true);
      // Folds: wavy inset copies of the outline, broken wherever they leave the cerebrum.
      for (const [f, amp, freq] of [[0.8, 3, 0.55], [0.6, 3.4, 0.7], [0.4, 2.6, 0.9], [0.22, 2, 1.2]]) {
        const pts = resample(outline, 1.2, true).map(([x, y], i) => {
          const cx = 104, cy = 56, dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1;
          const w = Math.sin(i * freq * 0.35) * amp;
          return [cx + dx * f + (dx / d) * w, cy + dy * f + (dy / d) * w];
        });
        let run = [];
        for (const p of resample(pts, step, true)) {
          if (inCerebrum(p[0], p[1])) run.push(p);
          else { if (run.length > 2) chain(run, zs(0.5), 0, false); run = []; }
        }
        if (run.length > 2) chain(run, zs(0.5), 0, false);
      }
      // Sylvian fissure and central sulcus: the two landmarks that make a side view read as a brain.
      const curve = (p0, p1, p2, p3) => resample(Array.from({ length: 60 }, (_, i) => bez(p0, p1, p2, p3, i / 59)), step, false);
      chain(curve([58, 92], [80, 80], [108, 68], [142, 70]), zs(0.42), 0, false);
      chain(curve([114, 10], [104, 30], [100, 48], [92, 74]), zs(0.55), 0, false);
    }
    // Cerebellum: outline plus its stripes (folia).
    const cbl = Array.from({ length: 50 }, (_, i) => {
      const a = (i / 50) * Math.PI * 2, c = Math.cos(-0.12), s = Math.sin(-0.12);
      const ex = 27 * Math.cos(a), ey = 14 * Math.sin(a);
      return [152 + ex * c - ey * s, 114 + ex * s + ey * c];
    });
    chain(resample(cbl, step, true), () => 0, 1, true);
    for (const dy of [-8, -3, 2, 7]) {
      const pts = Array.from({ length: 40 }, (_, i) => [128 + i * 1.25, 114 + dy + (i - 20) * -0.15 + Math.sin(i * 0.6) * 1.2])
        .filter(([x, y]) => probe.isPointInPath(cerebellum, x, y));
      for (const side of [-1, 1]) chain(resample(pts, step, false), () => side * 0.16, 1, false);
    }
    // Brain stem.
    for (const x of [128, 138]) chain(resample(Array.from({ length: 30 }, (_, i) => [x - i * 0.08, 104 + i * 1.4]), step, false), () => 0, 2, false);

    // Free neurons inside the volume, wired to whatever is nearest (folds included).
    const chainCount = nodes.length;
    const N = small ? 160 : 300;
    let guard = 0, made = 0;
    while (made < N && guard++ < 40000) {
      const x = rand(8, 196), y = rand(4, 148);
      let part = -1;
      if (inCerebrum(x, y)) part = 0;
      else if (probe.isPointInPath(cerebellum, x, y)) part = 1;
      if (part < 0) continue;
      const z = part === 0 ? (Math.random() < 0.5 ? -1 : 1) * (0.04 + 0.5 * depth(x, y) * Math.sqrt(rand(0.1, 1))) : rand(-0.2, 0.2);
      addNode(x, y, z, part, false);
      made++;
    }
    const MAX = 0.16 * 0.16;
    for (let i = chainCount; i < nodes.length; i++) {
      const a = nodes[i], near = [];
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const b = nodes[j];
        const d = (a.hx - b.hx) ** 2 + (a.hy - b.hy) ** 2 + (a.hz - b.hz) ** 2;
        if (d < MAX) near.push([d, j]);
      }
      near.sort((p, q) => p[0] - q[0]);
      for (const [, j] of near.slice(0, 3)) if (!adj[i].includes(j)) link(i, j, false);
    }
  };

  // ── Viewport + where the brain should sit (set by app.js per scene).
  let W = 0, H = 0, dpr = 1;
  const state = { x: 0.7, y: 0.5, scale: 0.42, alpha: 1, region: -1 };
  const target = { ...state };
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // Pre-rendered glow sprite: drawing an image is far cheaper than shadowBlur per node.
  const glow = document.createElement("canvas");
  glow.width = glow.height = 64;
  {
    const g = glow.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,255,255,1)");
    r.addColorStop(0.18, "rgba(200,230,255,.75)");
    r.addColorStop(0.45, "rgba(143,211,255,.2)");
    r.addColorStop(1, "rgba(143,211,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }


  // ── Signals.
  const pulses = [];
  const MAXP = 320;
  const fireFrom = (i, gen = 0, maxGen = 3) => {
    const n = nodes[i];
    if (!n) return;
    n.act = 1;
    if (gen >= maxGen) return;
    const out = adj[i];
    if (!out.length) return;
    const fan = gen === 0 ? Math.min(out.length, 3) : 1 + (Math.random() < 0.35 ? 1 : 0);
    for (let k = 0; k < fan && pulses.length < MAXP; k++) {
      const j = out[(Math.random() * out.length) | 0];
      pulses.push({ a: i, b: j, t: 0, v: rand(1.6, 2.6), gen: gen + 1, maxGen });
    }
  };

  // ── Pointer.
  const mouse = { x: -9999, y: -9999, on: false, px: 0, py: 0, moved: 0 };
  addEventListener("pointermove", (e) => {
    mouse.moved += Math.hypot(e.clientX - mouse.x, e.clientY - mouse.y) || 0;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; mouse.touch = e.pointerType !== "mouse";
  }, { passive: true });
  addEventListener("pointerleave", () => { mouse.on = false; });
  // A finger lifts; a cursor doesn't. Don't leave connectors stuck where the last tap was.
  addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") setTimeout(() => (mouse.on = false), 600); });
  addEventListener("scroll", () => { if (mouse.on && mouse.touch) mouse.on = false; }, { passive: true });
  document.addEventListener("mouseleave", () => { mouse.on = false; });
  addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button, input, pre, table")) return;
    burst(e.clientX, e.clientY);
  });
  const nearest = (x, y, r) => {
    const out = [];
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i], d = Math.hypot(n.sx - x, n.sy - y);
      if (d < r) out.push([d, i]);
    }
    return out.sort((a, b) => a[0] - b[0]);
  };
  const burst = (x, y) => {
    for (const [, i] of nearest(x, y, 120).slice(0, 8)) fireFrom(i, 0, 5);
  };

  // ── Frame.
  let last = performance.now(), t = 0, spont = 0, hoverFire = 0;
  const R_MOUSE = 170;
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduce) t += dt;

    // Ease toward the scene's target.
    const k = 1 - Math.pow(0.0015, dt);
    state.x = lerp(state.x, target.x, k);
    state.y = lerp(state.y, target.y, k);
    state.scale = lerp(state.scale, target.scale, k);
    state.alpha = lerp(state.alpha, target.alpha, k);
    state.region = target.region;
    mouse.px = lerp(mouse.px, mouse.on ? mouse.x / W - 0.5 : 0, 1 - Math.pow(0.02, dt));
    mouse.py = lerp(mouse.py, mouse.on ? mouse.y / H - 0.5 : 0, 1 - Math.pow(0.02, dt));

    const cx = state.x * W, cy = state.y * H;
    const R = state.scale * Math.min(W, H * 1.25);
    const ry = (reduce ? -0.35 : Math.sin(t * 0.17) * 0.32 - 0.18) + mouse.px * 0.5;
    const rx = -0.12 + mouse.py * 0.3;
    const cyR = Math.cos(ry), syR = Math.sin(ry), cxR = Math.cos(rx), sxR = Math.sin(rx);
    const F = 2.6;

    // Project.
    for (const n of nodes) {
      const wob = reduce ? 0 : 0.008;
      const x = n.hx + Math.sin(t * n.sp + n.ph) * wob;
      const y = n.hy + Math.cos(t * n.sp * 0.9 + n.ph) * wob;
      const z = n.hz;
      const x1 = x * cyR - z * syR, z1 = x * syR + z * cyR;
      const y1 = y * cxR - z1 * sxR, z2 = y * sxR + z1 * cxR;
      const p = F / (F + z2);
      let sx = cx + x1 * R * p, sy = cy + y1 * R * p;
      // Cells near the cursor lean toward it, like dendrites reaching.
      if (mouse.on) {
        const ddx = mouse.x - sx, ddy = mouse.y - sy, d = Math.hypot(ddx, ddy);
        if (d < R_MOUSE && d > 0.1) {
          const pull = (1 - d / R_MOUSE) ** 2 * 18;
          n.dx = lerp(n.dx, (ddx / d) * pull, 0.15); n.dy = lerp(n.dy, (ddy / d) * pull, 0.15);
          n.act = Math.max(n.act, (1 - d / R_MOUSE) * 0.75);
        } else { n.dx *= 0.9; n.dy *= 0.9; }
      } else { n.dx *= 0.9; n.dy *= 0.9; }
      n.sx = sx + n.dx; n.sy = sy + n.dy;
      n.sd = (1 - z2) * 0.5 + 0.25; // depth cue: nearer cells brighter
      if (state.region >= 0 && n.region === state.region && !reduce && Math.random() < 0.005) n.act = Math.max(n.act, 0.9);
      n.act *= Math.pow(0.18, dt);
    }

    // Spontaneous thought.
    if (!reduce) {
      spont -= dt;
      if (spont <= 0) {
        spont = rand(0.12, 0.35);
        let pool = nodes;
        if (state.region >= 0) pool = nodes.filter((n) => n.region === state.region);
        const n = pool[(Math.random() * pool.length) | 0];
        if (n) fireFrom(nodes.indexOf(n), 0, 3);
      }
    }
    // Hovering keeps firing from the cell under the cursor.
    hoverFire -= dt;
    if (mouse.on && hoverFire <= 0 && mouse.moved > 6) {
      hoverFire = 0.09; mouse.moved = 0;
      const nn = nearest(mouse.x, mouse.y, R_MOUSE * 0.7);
      if (nn.length) fireFrom(nn[(Math.random() * Math.min(3, nn.length)) | 0][1], 0, 4);
    }

    // Draw.
    ctx.clearRect(0, 0, W, H);
    const A = state.alpha;
    if (A < 0.01) return requestAnimationFrame(frame);

    // Soft aura behind the brain.
    const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25);
    aura.addColorStop(0, `rgba(143,211,255,${0.06 * A})`);
    aura.addColorStop(0.5, `rgba(255,255,255,${0.015 * A})`);
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura; ctx.fillRect(0, 0, W, H);

    // Wires, bucketed by brightness so each bucket is one stroke.
    const B = 6, buckets = Array.from({ length: B }, () => new Path2D());
    const hot = [];
    for (const [i, j, isChain] of edges) {
      const a = nodes[i], b = nodes[j];
      const act = Math.max(a.act, b.act);
      if (act > 0.25) { hot.push([a, b, act]); continue; }
      // Folds and outline draw brighter than the free wiring, so the shape reads first.
      const v = Math.max(-1, Math.min(B - 1, ((a.sd + b.sd) * 0.5 * B * 0.7 + (isChain ? 1.6 : -0.6)) | 0));
      if (v >= 0) { buckets[v].moveTo(a.sx, a.sy); buckets[v].lineTo(b.sx, b.sy); }
    }
    ctx.lineWidth = 0.7;
    for (let v = 0; v < B; v++) {
      ctx.strokeStyle = `rgba(215,222,235,${(0.04 + v * 0.05) * A})`;
      ctx.stroke(buckets[v]);
    }
    ctx.lineWidth = 1.1;
    for (const [a, b, act] of hot) {
      const g = ctx.createLinearGradient(a.sx, a.sy, b.sx, b.sy);
      g.addColorStop(0, `hsla(204,100%,72%,${act * 0.75 * A})`);
      g.addColorStop(1, `hsla(204,100%,72%,${act * 0.75 * A})`);
      ctx.strokeStyle = g;
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    }

    // Connectors from the cursor to the nearest cells.
    if (mouse.on && A > 0.2) {
      const nn = nearest(mouse.x, mouse.y, R_MOUSE).slice(0, 14);
      for (const [d, i] of nn) {
        const n = nodes[i], s = 1 - d / R_MOUSE;
        const g = ctx.createLinearGradient(mouse.x, mouse.y, n.sx, n.sy);
        g.addColorStop(0, `rgba(255,255,255,${0.55 * s * A})`);
        g.addColorStop(1, `hsla(204,100%,70%,${0.35 * s * A})`);
        ctx.strokeStyle = g; ctx.lineWidth = 0.6 + s * 1.2;
        ctx.beginPath();
        // A slight curve reads more like a dendrite than a straight ruler line.
        const mx = (mouse.x + n.sx) / 2 + (n.sy - mouse.y) * 0.12, my = (mouse.y + n.sy) / 2 - (n.sx - mouse.x) * 0.12;
        ctx.moveTo(mouse.x, mouse.y); ctx.quadraticCurveTo(mx, my, n.sx, n.sy); ctx.stroke();
      }
      if (nn.length) {
        const s = 26;
        ctx.globalAlpha = 0.5 * A;
        ctx.drawImage(glow, mouse.x - s / 2, mouse.y - s / 2, s, s);
        ctx.globalAlpha = 1;
      }
    }

    // Cells.
    for (const n of nodes) {
      if (n.minor && n.act < 0.15) continue;
      const r = (0.8 + n.sd * 1.3) * (n.part === 2 ? 0.8 : 1) * (n.minor ? 0.7 : 1);
      ctx.fillStyle = `hsla(204,${Math.round(n.act * 100)}%,${86 - n.act * 4}%,${(0.25 + n.sd * 0.55 + n.act * 0.4) * A})`;
      ctx.beginPath(); ctx.arc(n.sx, n.sy, r + n.act * 1.6, 0, Math.PI * 2); ctx.fill();
      if (n.act > 0.2) {
        const s = 14 + n.act * 26;
        ctx.globalAlpha = n.act * 0.85 * A;
        ctx.drawImage(glow, n.sx - s / 2, n.sy - s / 2, s, s);
        ctx.globalAlpha = 1;
      }
    }

    // Signals in flight.
    for (let p = pulses.length - 1; p >= 0; p--) {
      const q = pulses[p];
      q.t += dt * q.v;
      const a = nodes[q.a], b = nodes[q.b];
      if (!a || !b) { pulses.splice(p, 1); continue; }
      if (q.t >= 1) {
        pulses.splice(p, 1);
        fireFrom(q.b, q.gen, q.maxGen);
        continue;
      }
      const x = lerp(a.sx, b.sx, q.t), y = lerp(a.sy, b.sy, q.t);
      const tx = lerp(a.sx, b.sx, Math.max(0, q.t - 0.25)), ty = lerp(a.sy, b.sy, Math.max(0, q.t - 0.25));
      ctx.strokeStyle = `hsla(204,100%,80%,${0.8 * A})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
      ctx.globalAlpha = 0.9 * A;
      ctx.drawImage(glow, x - 6, y - 6, 12, 12);
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(frame);
  };

  resize();
  build();
  let rt;
  addEventListener("resize", () => {
    const wasSmall = W < 700;
    resize();
    clearTimeout(rt);
    if ((W < 700) !== wasSmall) rt = setTimeout(() => { pulses.length = 0; build(); }, 150);
  });
  requestAnimationFrame(frame);

  window.Brain = {
    setTarget(o) { Object.assign(target, o); },
    burst,
  };
})();
