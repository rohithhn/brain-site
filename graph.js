// Knowledge graph showcase (home page): the same visual language as the control panel's graph.
// Glowing project hubs, concepts orbiting them, tapered links carrying soft particles. Self-contained
// canvas, no dependencies. Demo data only (made-up projects). Starts when scrolled into view, pauses
// off screen, settles and stops its physics, and never animates under prefers-reduced-motion.
// Page scroll is never hijacked: wheel/pinch zoom and touch-drag only work after a click or tap
// into the graph ("live" mode), which ends on Esc, a click outside, or scrolling it out of view.
(() => {
  const fig = document.getElementById("kg");
  if (!fig) return;
  const cv = fig.querySelector("canvas"), tip = fig.querySelector(".kg-tip"), hint = fig.querySelector(".kg-hint");
  const live$ = fig.querySelector(".kg-live");
  const RM = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FONT = 'Geist, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ── demo memory: made-up projects, concepts, and example memory titles
  const P = [
    ["bakery-app", 205, 180], ["mobile-checkout", 330, 150], ["data-pipeline", 268, 140], ["docs-site", 40, 90], ["infra", 155, 120],
  ];
  // [concept, home project, memories, other projects, example memories]
  const C = [
    ["offline-first", "bakery-app", 34, ["mobile-checkout"], ["Orders queue locally and sync when the shop's wifi drops", "Chose SQLite over IndexedDB for the till app"]],
    ["sqlite", "bakery-app", 41, ["data-pipeline", "infra"], ["WAL mode fixed the 'database is locked' errors", "Nightly VACUUM runs after the backup, never before"]],
    ["order-queue", "bakery-app", 22, ["mobile-checkout"], ["Retries back off to 30s; duplicates are dropped by order id"]],
    ["pricing", "bakery-app", 18, ["mobile-checkout"], ["Prices are stored in cents, rounded only at display time"]],
    ["receipts", "bakery-app", 12, [], ["Receipt printer needs ESC/POS, 42 columns wide"]],
    ["inventory", "bakery-app", 15, ["data-pipeline"], ["Stock counts reconcile at close, not on every sale"]],
    ["push-notifications", "bakery-app", 9, ["mobile-checkout"], ["Pickup-ready pushes go out when the baker taps Done"]],
    ["stripe", "mobile-checkout", 29, ["bakery-app"], ["Payment intents are created server-side only", "Webhook signature check moved before JSON parsing"]],
    ["apple-pay", "mobile-checkout", 14, [], ["Merchant domain file must be served without a redirect"]],
    ["cart-state", "mobile-checkout", 21, [], ["Cart lives in one reducer; no state in the screens"]],
    ["react-native", "mobile-checkout", 26, ["bakery-app"], ["Upgraded to the new architecture; two native modules pinned"]],
    ["deep-links", "mobile-checkout", 8, [], ["Universal links need the app id prefix, not the bundle id"]],
    ["a11y", "mobile-checkout", 11, ["docs-site"], ["Pay button announces the total, not just 'Pay'"]],
    ["feature-flags", "mobile-checkout", 10, ["infra"], ["Flags default off and expire after 30 days"]],
    ["kafka", "data-pipeline", 24, ["infra"], ["Partition by store id so a store's events stay in order"]],
    ["schema-registry", "data-pipeline", 13, [], ["Only backward-compatible schema changes are allowed"]],
    ["dbt", "data-pipeline", 19, [], ["Daily sales model is incremental on order date"]],
    ["backfills", "data-pipeline", 9, [], ["Backfills run per day in reverse so recent data lands first"]],
    ["parquet", "data-pipeline", 12, [], ["Row groups of 128 MB made the scans twice as fast"]],
    ["airflow", "data-pipeline", 15, ["infra"], ["One DAG per source; retries=3 with a 10 minute delay"]],
    ["data-quality", "data-pipeline", 11, [], ["Null store ids fail the run instead of being dropped"]],
    ["search", "docs-site", 14, [], ["Search index rebuilds on deploy, about 40 seconds"]],
    ["mdx", "docs-site", 12, [], ["Code blocks take a title prop; no inline styles"]],
    ["versioning", "docs-site", 8, [], ["Docs are versioned per minor release, latest is the default"]],
    ["seo", "docs-site", 7, [], ["Canonical URLs point at the latest version"]],
    ["style-guide", "docs-site", 9, ["mobile-checkout"], ["Sentence case for headings; no exclamation marks"]],
    ["terraform", "infra", 22, [], ["State is split per environment; plans run in CI only"]],
    ["kubernetes", "infra", 17, ["data-pipeline"], ["Requests set on every pod; limits only on memory"]],
    ["github-actions", "infra", 20, ["docs-site", "mobile-checkout"], ["Cache keyed on the lockfile hash cut CI to 4 minutes"]],
    ["secrets", "infra", 13, ["mobile-checkout"], ["Secrets come from the vault at boot, never from env files"]],
    ["observability", "infra", 16, ["data-pipeline", "bakery-app"], ["Every request carries a trace id into the logs"]],
    ["backups", "infra", 10, ["bakery-app"], ["Restores are tested monthly, not just backups"]],
    ["postgres", "infra", 19, ["data-pipeline", "mobile-checkout"], ["Connection pool of 20; long queries killed at 30s"]],
    ["caching", "infra", 12, ["docs-site", "mobile-checkout"], ["Cache keys include the price version, so updates show at once"]],
  ];
  // concept links (co-occurring ideas), weight 1..5
  const R = [["offline-first", "sqlite", 5], ["offline-first", "order-queue", 4], ["order-queue", "stripe", 3], ["pricing", "stripe", 3], ["pricing", "receipts", 2],
    ["inventory", "dbt", 2], ["sqlite", "backups", 3], ["cart-state", "pricing", 3], ["react-native", "push-notifications", 2], ["react-native", "deep-links", 2],
    ["stripe", "apple-pay", 4], ["kafka", "schema-registry", 4], ["kafka", "airflow", 2], ["dbt", "parquet", 3], ["dbt", "data-quality", 3], ["backfills", "airflow", 3],
    ["search", "mdx", 2], ["versioning", "seo", 2], ["style-guide", "a11y", 2], ["terraform", "kubernetes", 3], ["terraform", "secrets", 3], ["github-actions", "terraform", 2],
    ["observability", "kubernetes", 3], ["postgres", "backups", 3], ["postgres", "kafka", 2], ["caching", "search", 2], ["feature-flags", "github-actions", 2], ["sqlite", "postgres", 2]];

  // ── graph model
  let nodes = [], edges = [], byId = new Map(), nbrs = new Map(), maxW = 1;
  const anchors = new Map();
  P.forEach(([id, h, w], i) => {
    const a = i / P.length * 6.2832 - 1.3;
    anchors.set(id, { x: Math.cos(a) * 230, y: Math.sin(a) * 175 });
    const n = { id, label: id, proj: true, h, weight: w, r: 15 + Math.sqrt(w / 180) * 12 };
    nodes.push(n); byId.set(id, n);
  });
  for (const [label, home, w, also, mem] of C) {
    const n = { id: "c:" + label, label, proj: false, home, h: byId.get(home).h, weight: w, mem, also, r: 4 + Math.sqrt(w / 41) * 8 };
    nodes.push(n); byId.set(n.id, n);
    edges.push({ s: byId.get(home), t: n, w: w, kind: "has" });
    for (const p of also) edges.push({ s: byId.get(p), t: n, w: Math.max(2, Math.round(w / 4)), kind: "has" });
  }
  for (const [a, b, w] of R) edges.push({ s: byId.get("c:" + a), t: byId.get("c:" + b), w: w * 5, kind: "related" });
  maxW = Math.max(...edges.map((e) => e.w));
  for (const e of edges) for (const [a, b] of [[e.s, e.t], [e.t, e.s]]) { if (!nbrs.has(a)) nbrs.set(a, new Set()); nbrs.get(a).add(b); }
  const nb = (n) => nbrs.get(n) || new Set();
  const strong = new Set([...edges].sort((a, b) => b.w - a.w).slice(0, 34));
  for (const e of edges) e.parts = strong.has(e) ? [{ o: Math.random(), sp: 0.12 + Math.random() * 0.1 }, ...(e.w > maxW * 0.6 ? [{ o: Math.random() + 0.5, sp: 0.15 }] : [])] : null;
  nodes.forEach((n, i) => {
    n.an = n.proj ? anchors.get(n.id) : byId.get(n.home);
    n.ph = Math.random() * 6.2832; n.born = i; n.appear = 0; n.dim = 1; n.vx = n.vy = 0; n.x = 0; n.y = 0;
  });
  const order = [...nodes].sort((a, b) => (b.proj - a.proj) || (b.weight - a.weight));

  // ── sprites: pre-rendered glow, shaded orb and particle per hue
  const sprites = new Map();
  function sprite(h) {
    let s = sprites.get(h); if (s) return s;
    const mk = (sz, fn) => { const c = document.createElement("canvas"); c.width = c.height = sz; fn(c.getContext("2d"), sz); return c; };
    const glow = mk(128, (g, S) => { const r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      r.addColorStop(0, hsl(h, 95, 70, 0.55)); r.addColorStop(0.25, hsl(h, 90, 62, 0.22)); r.addColorStop(0.6, hsl(h, 90, 55, 0.06)); r.addColorStop(1, hsl(h, 90, 55, 0));
      g.fillStyle = r; g.fillRect(0, 0, S, S); });
    const orb = mk(96, (g, S) => { const r = g.createRadialGradient(S * 0.36, S * 0.32, S * 0.02, S * 0.5, S * 0.5, S * 0.5);
      r.addColorStop(0, hsl(h, 100, 92)); r.addColorStop(0.35, hsl(h, 85, 68)); r.addColorStop(0.8, hsl(h, 70, 46)); r.addColorStop(1, hsl(h, 70, 34));
      g.fillStyle = r; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 1, 0, 6.2832); g.fill();
      g.strokeStyle = hsl(h, 100, 88, 0.55); g.lineWidth = 1.5; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 1.5, 0, 6.2832); g.stroke(); });
    const dot = mk(32, (g, S) => { const r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      r.addColorStop(0, "rgba(255,255,255,.95)"); r.addColorStop(0.25, hsl(h, 100, 80, 0.8)); r.addColorStop(1, hsl(h, 100, 60, 0)); g.fillStyle = r; g.fillRect(0, 0, S, S); });
    s = { glow, orb, dot }; sprites.set(h, s); return s;
  }

  // ── canvas + camera
  let ctx, W = 0, H = 0, dpr = 1, cam = { x: 0, y: 0, z: 1 }, tgt = { x: 0, y: 0, z: 1 }, userCam = false;
  let alpha = 1, started = false, visible = false, running = false, t0 = 0, tStart = 0, live = false;
  let hover = null, sel = null, kb = -1;
  function size() {
    const r = cv.getBoundingClientRect(); if (!r.width) return false;
    dpr = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx = cv.getContext("2d"); return true;
  }
  const toWorld = (px, py, c = cam) => ({ x: (px - W / 2 - c.x) / c.z, y: (py - H / 2 - c.y) / c.z });
  const toScreen = (x, y) => ({ x: x * cam.z + W / 2 + cam.x, y: y * cam.z + H / 2 + cam.y });
  const clampZ = (z) => Math.max(0.35, Math.min(4, z));
  function fit(set, instant) {
    const list = set ? [...set] : nodes; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const n of list) { const r = n.r + (n.proj ? 34 : 22); x0 = Math.min(x0, n.x - r); y0 = Math.min(y0, n.y - r); x1 = Math.max(x1, n.x + r); y1 = Math.max(y1, n.y + r); }
    const z = clampZ(Math.min((W - 32) / (x1 - x0), (H - 70) / (y1 - y0), set ? 2 : 1.5));
    tgt = { z, x: -((x0 + x1) / 2) * z, y: -((y0 + y1) / 2) * z - 6 }; if (instant || RM()) cam = { ...tgt }; kick();
  }
  function zoomAt(px, py, f) { const w = toWorld(px, py, tgt), z = clampZ(tgt.z * f); tgt = { z, x: px - W / 2 - w.x * z, y: py - H / 2 - w.y * z }; userCam = true; if (RM()) cam = { ...tgt }; kick(); }

  // ── physics: clustered force layout that cools to rest
  function tick() {
    const a = alpha, n = nodes.length;
    for (const p of nodes) { const k = p.proj ? 0.05 : 0.014; p.vx += (p.an.x - p.x) * k * a; p.vy += (p.an.y - p.y) * k * a; }
    for (let i = 0; i < n; i++) { const A = nodes[i]; for (let j = i + 1; j < n; j++) { const B = nodes[j];
      let dx = A.x - B.x, dy = A.y - B.y, d2 = dx * dx + dy * dy; if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1; }
      const d = Math.sqrt(d2), min = A.r + B.r + (A.proj || B.proj ? 24 : 10);
      let f = (A.proj && B.proj ? 6000 : 900 + (A.r + B.r) * 40) / d2 * a; if (d < min) f += (min - d) * 0.25;
      dx /= d; dy /= d; A.vx += dx * f; A.vy += dy * f; B.vx -= dx * f; B.vy -= dy * f; } }
    for (const e of edges) { let dx = e.t.x - e.s.x, dy = e.t.y - e.s.y; const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const L = e.kind === "has" ? e.s.r + e.t.r + 40 + (1 - e.w / maxW) * 40 : e.s.r + e.t.r + 50, k = e.kind === "has" ? (e.t.home === e.s.id ? 0.04 : 0.006) : 0.01;
      const f = (d - L) * k * a; dx /= d; dy /= d; e.s.vx += dx * f; e.s.vy += dy * f; e.t.vx -= dx * f; e.t.vy -= dy * f; }
    for (const p of nodes) { if (p.fixed) { p.x = p.fx; p.y = p.fy; p.vx = p.vy = 0; continue; }
      p.vx *= 0.82; p.vy *= 0.82; const sp = Math.hypot(p.vx, p.vy); if (sp > 24) { p.vx *= 24 / sp; p.vy *= 24 / sp; } p.x += p.vx; p.y += p.vy; }
    alpha *= 0.985; if (alpha < 0.004) alpha = 0;
  }
  const reheat = (v = 0.3) => { alpha = Math.max(alpha, v); kick(); };

  // ── drawing
  const curve = (e) => { const sx = e.s.x, sy = e.s.y, tx = e.t.x, ty = e.t.y, mx = (sx + tx) / 2, my = (sy + ty) / 2, b = e.kind === "related" ? 0.18 : 0.1; return [sx, sy, mx - (ty - sy) * b, my + (tx - sx) * b, tx, ty]; };
  const qpt = (c, t) => { const u = 1 - t; return [u * u * c[0] + 2 * u * t * c[2] + t * t * c[4], u * u * c[1] + 2 * u * t * c[3] + t * t * c[5]]; };
  function taper(c, w0, w1) { const dx = c[4] - c[0], dy = c[5] - c[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, wm = (w0 + w1) / 2;
    ctx.beginPath(); ctx.moveTo(c[0] + nx * w0, c[1] + ny * w0); ctx.quadraticCurveTo(c[2] + nx * wm, c[3] + ny * wm, c[4] + nx * w1, c[5] + ny * w1);
    ctx.lineTo(c[4] - nx * w1, c[5] - ny * w1); ctx.quadraticCurveTo(c[2] - nx * wm, c[3] - ny * wm, c[0] - nx * w0, c[1] - ny * w0); ctx.closePath(); }
  function focusSet() { const f = hover || sel; if (!f) return null; const s = new Set(nb(f)); s.add(f); return s; }
  function draw(now) {
    if (!ctx) return; const T = (now - t0) / 1000, still = RM(), F = focusSet(), f = hover || sel;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    for (const n of nodes) { const td = F ? (F.has(n) ? 1 : 0.1) : 1; n.dim += (td - n.dim) * (still ? 1 : 0.18);
      if (n.appear < 1 && (still || (now - tStart) / 16 > n.born * 0.9)) n.appear = still ? 1 : Math.min(1, n.appear + 0.04); }
    ctx.save(); ctx.translate(W / 2 + cam.x, H / 2 + cam.y); ctx.scale(cam.z, cam.z);
    ctx.globalCompositeOperation = "lighter";
    for (const e of edges) { const a0 = Math.min(e.s.appear, e.t.appear); if (a0 < 0.02) continue;
      const on = F && F.has(e.s) && F.has(e.t) && (e.s === f || e.t === f), em = F ? (on ? 1 : 0.06) : 1, wn = e.w / maxW, c = curve(e);
      const base = e.kind === "has" ? 0.1 + wn * 0.42 : 0.07 + wn * 0.3;
      const w0 = (e.kind === "has" ? 1.1 + wn * 3.2 : 0.7 + wn * 1.6) * (on ? 1.5 : 1) / Math.max(0.6, cam.z * 0.8), w1 = Math.max(0.25, w0 * 0.18);
      ctx.globalAlpha = Math.min(0.95, base * em * (on ? 2.2 : 1)) * a0;
      if (e.s.h !== e.t.h) { const g = ctx.createLinearGradient(c[0], c[1], c[4], c[5]); g.addColorStop(0, hsl(e.s.h, 85, 64)); g.addColorStop(1, hsl(e.t.h, 85, 64)); ctx.fillStyle = g; }
      else ctx.fillStyle = hsl(e.s.h, 85, 64);
      taper(c, w0, w1); ctx.fill(); }
    if (!still) for (const e of edges) { if (!e.parts) continue; const a0 = Math.min(e.s.appear, e.t.appear); if (a0 < 0.3) continue;
      const on = F && F.has(e.s) && F.has(e.t); if (F && !on) continue; const c = curve(e), sp = sprite(e.t.h).dot;
      for (const p of e.parts) { const t = (T * p.sp + p.o) % 1, [x, y] = qpt(c, t), s = (on ? 9 : 6) / Math.max(0.7, cam.z * 0.9);
        ctx.globalAlpha = a0 * (on ? 0.95 : 0.55) * Math.sin(t * Math.PI); ctx.drawImage(sp, x - s / 2, y - s / 2, s, s); } }
    for (const n of nodes) { const a0 = n.appear * n.dim; if (a0 < 0.02) continue;
      const br = still ? 1 : 1 + 0.07 * Math.sin(T * 1.3 + n.ph), hot = n === f, R = n.r * (n.proj ? 4.2 : 3.2) * br * (hot ? 1.35 : 1);
      ctx.globalAlpha = a0 * (n.proj ? 0.9 : 0.6); ctx.drawImage(sprite(n.h).glow, n.x - R, n.y - R, R * 2, R * 2); }
    ctx.globalCompositeOperation = "source-over";
    for (const n of nodes) { if (n.appear < 0.02) continue; const ease = 1 - Math.pow(1 - n.appear, 3), r = n.r * ease * (n === hover ? 1.12 : 1);
      ctx.globalAlpha = n.appear * (n.dim < 0.5 && n.proj ? 0.12 : 0.18 + 0.82 * n.dim); ctx.drawImage(sprite(n.h).orb, n.x - r, n.y - r, r * 2, r * 2);
      if (n.proj) { ctx.lineWidth = 1.4 / cam.z; ctx.strokeStyle = hsl(n.h, 90, 80, 0.45 * n.dim); ctx.beginPath(); ctx.arc(n.x, n.y, r + 5, 0, 6.2832); ctx.stroke();
        const s0 = still ? 0 : T * 0.5 + n.ph; ctx.lineWidth = 2 / cam.z; ctx.strokeStyle = hsl(n.h, 95, 82, 0.85 * n.dim);
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 9, s0, s0 + 1.4); ctx.stroke(); ctx.beginPath(); ctx.arc(n.x, n.y, r + 9, s0 + 3.14, s0 + 3.6); ctx.stroke(); }
      if (n === sel || (kb >= 0 && n === order[kb] && document.activeElement === cv)) { ctx.lineWidth = 2 / cam.z; ctx.setLineDash([4 / cam.z, 3 / cam.z]); ctx.strokeStyle = "rgba(255,255,255,.9)";
        ctx.beginPath(); ctx.arc(n.x, n.y, r + (n.proj ? 14 : 6), 0, 6.2832); ctx.stroke(); ctx.setLineDash([]); } }
    ctx.restore(); ctx.globalAlpha = 1; labels(F, f);
  }
  function labels(F, f) {
    const placed = [], cand = [];
    for (const n of nodes) if (n.proj) { const p = toScreen(n.x, n.y), r = n.r * cam.z; placed.push([p.x - r, p.y - r, p.x + r, p.y + r]); }
    for (const n of nodes) { if (n.appear < 0.6) continue; const s = toScreen(n.x, n.y); if (s.x < -60 || s.y < -30 || s.x > W + 60 || s.y > H + 30) continue;
      let pr = n.proj ? 600 + n.weight : n.weight + (n.r * cam.z > 9 ? 200 : 0);
      if (F) { if (n === f) pr = 1e6; else if (F.has(n)) pr += 3000; else pr -= 5000; }
      cand.push({ n, s, pr }); }
    cand.sort((a, b) => b.pr - a.pr); let budget = Math.max(8, Math.round(W * H / 11000));
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const c of cand) { if (budget <= 0 && c.pr < 3000) break; const n = c.n, big = n.proj, hot = n === f; if (c.pr < 0 && !hot) continue;
      const fs = big ? 13 : hot ? 12.5 : 11.5; ctx.font = `${big || hot ? 600 : 500} ${fs}px ${FONT}`;
      const tw = (n["tw" + fs] ??= ctx.measureText(n.label).width), pad = big ? 9 : 5, bw = tw + pad * 2, bh = big ? 22 : 17;
      const y = c.s.y + n.r * cam.z + (big ? 24 : 12) + bh / 2 - 6, x = c.s.x, rc = [x - bw / 2, y - bh / 2, x + bw / 2, y + bh / 2];
      if (!hot && placed.some((p) => rc[0] < p[2] + 2 && rc[2] > p[0] - 2 && rc[1] < p[3] + 1 && rc[3] > p[1] - 1)) continue;
      placed.push(rc); budget--;
      ctx.globalAlpha = Math.min(1, n.appear) * (F && !F.has(n) ? 0.35 : 1);
      if (big || hot) { ctx.fillStyle = "rgba(6,7,10,.86)"; ctx.strokeStyle = hsl(n.h, 90, 70, big ? 0.45 : 0.6); ctx.lineWidth = 1;
        rr(rc[0], rc[1], bw, bh, bh / 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = big ? "#f5f5f6" : hsl(n.h, 60, 90); ctx.fillText(n.label, x, y + 0.5); }
      else { ctx.lineWidth = 3.5; ctx.strokeStyle = "rgba(0,0,0,.85)"; ctx.lineJoin = "round"; ctx.strokeText(n.label, x, y); ctx.fillStyle = hsl(n.h, 45, 84); ctx.fillText(n.label, x, y); } }
    ctx.globalAlpha = 1;
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  // ── loop: runs only while on screen and something moves
  function kick() { if (running || !started || !visible) return; running = true; requestAnimationFrame(frame); }
  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    if (alpha > 0) tick();
    const k = RM() ? 1 : 0.18; cam.x += (tgt.x - cam.x) * k; cam.y += (tgt.y - cam.y) * k; cam.z += (tgt.z - cam.z) * k;
    if (!userCam && alpha > 0.05 && !sel) fit(null, false);
    draw(now);
    const moving = Math.abs(tgt.x - cam.x) + Math.abs(tgt.y - cam.y) > 0.3 || Math.abs(tgt.z - cam.z) > 0.001;
    if (RM() && alpha === 0 && !moving && !drag) { running = false; return; }
    requestAnimationFrame(frame);
  }
  function start() {
    if (started) return; started = true; size();
    nodes.forEach((n) => { const a = Math.random() * 6.2832, d = n.proj ? 4 : 20 + Math.random() * 30, base = n.proj ? { x: n.an.x * 0.4, y: n.an.y * 0.4 } : anchors.get(n.home);
      n.x = base.x * 0.6 + Math.cos(a) * d; n.y = base.y * 0.6 + Math.sin(a) * d; });
    for (let i = 0; i < (RM() ? 400 : 30); i++) tick();
    t0 = tStart = performance.now(); fit(null, true); kick();
  }

  // ── tooltip / pinned card
  function card(n, px, py, pinned) {
    if (!n) { tip.classList.remove("on"); return; }
    let html;
    if (n.proj) { const cs = [...nb(n)].filter((m) => !m.proj && m.home === n.id).sort((a, b) => b.weight - a.weight);
      html = `<span class="k">Project</span><b>${esc(n.label)}</b><span class="m">${n.weight} memories · ${cs.length} concepts</span>` +
        `<span class="cs">${cs.slice(0, 5).map((m) => `<i style="--h:${m.h}">${esc(m.label)}</i>`).join("")}</span><span class="h">${pinned ? "Click again or Reset to zoom out" : "Click to focus this cluster"}</span>`; }
    else { const ps = [n.home, ...n.also];
      html = `<span class="k">Concept</span><b>${esc(n.label)}</b><span class="m">${n.weight} memories · ${ps.length} project${ps.length > 1 ? "s" : ""}</span>` +
        `<span class="ps">${ps.map((p) => `<i style="--h:${byId.get(p).h}">${esc(p)}</i>`).join("")}</span>` +
        `<span class="mem">${n.mem.slice(0, 2).map((t) => `<q>${esc(t)}</q>`).join("")}</span>`; }
    tip.innerHTML = html; tip.classList.add("on");
    const tw = tip.offsetWidth, th = tip.offsetHeight; let x = px + 16, y = py + 14;
    // a pinned card sits in a corner so it never covers the cluster it describes
    if (pinned) { x = 14; y = 14; tip.style.transform = `translate(${x}px,${y}px)`; return; }
    if (x + tw > W - 8) x = px - tw - 16; if (x < 8) x = Math.max(8, Math.min(W - tw - 8, px - tw / 2));
    if (y + th > H - 8) y = py - th - 14; if (y < 8) y = 8;
    tip.style.transform = `translate(${x}px,${y}px)`;
  }
  function select(n) {
    sel = n || null; hover = null;
    if (!n) { card(null); userCam = false; fit(null, false); return; }
    kb = order.indexOf(n);
    if (n.proj) { const s = new Set(nb(n)); s.add(n); fit(s, false); userCam = true; }
    const p = toScreen(n.x, n.y); card(n, p.x, p.y, true); announce((n.proj ? "Project " : "Concept ") + n.label + ", " + n.weight + " memories");
    if (n.proj) setTimeout(() => { if (sel === n) { const q = toScreen(n.x, n.y); card(n, q.x, q.y, true); } }, 650);
    kick();
  }
  function announce(s) { if (live$) live$.textContent = s; }

  // ── live mode: only then do wheel, pinch and touch-drag belong to the graph
  function setLive(on) {
    live = on; fig.classList.toggle("is-live", on);
    const touch = matchMedia("(pointer: coarse)").matches;
    if (hint) hint.textContent = on ? (touch ? "Pinch to zoom · drag to move" : "Scroll to zoom · drag to move · Esc to leave") : (touch ? "Tap to explore" : "Click to explore · hover a node");
  }
  document.addEventListener("pointerdown", (e) => { if (live && !fig.contains(e.target)) setLive(false); });

  // ── pointer: hover, drag nodes with physics, pan, pinch, click
  const ptrs = new Map(); let drag = null, pan = null, pinch = null, down = null, moved = false;
  const pick = (px, py) => { const w = toWorld(px, py); let best = null, bd = 1e9;
    for (const n of nodes) { if (n.appear < 0.5) continue; const d = Math.hypot(n.x - w.x, n.y - w.y), hit = n.r + Math.max(5, 10 / cam.z); if (d < hit && d - n.r < bd) { bd = d - n.r; best = n; } } return best; };
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener("pointerdown", (e) => {
    if (!started) return; const p = pos(e), touch = e.pointerType === "touch";
    down = p; moved = false;
    if (touch && !live) return; // a first tap only arms the graph; the page keeps scrolling
    cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, p);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; if (drag) { drag.fixed = false; drag = null; } pan = null; return; }
    const n = pick(p.x, p.y);
    if (n) { drag = n; n.fixed = true; n.fx = n.x; n.fy = n.y; } else if (live) pan = { x: p.x, y: p.y, cx: tgt.x, cy: tgt.y };
  });
  cv.addEventListener("pointermove", (e) => {
    const p = pos(e);
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, p);
    if (down && Math.hypot(p.x - down.x, p.y - down.y) > 4) moved = true;
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch.d); pinch.d = d; return; }
    if (drag && moved) { const w = toWorld(p.x, p.y); drag.fx = w.x; drag.fy = w.y; reheat(0.25); card(null); cv.style.cursor = "grabbing"; return; }
    if (pan) { if (moved) { tgt.x = pan.cx + (p.x - pan.x); tgt.y = pan.cy + (p.y - pan.y); cam.x = tgt.x; cam.y = tgt.y; userCam = true; kick(); } return; }
    if (e.pointerType === "touch") return;
    const n = pick(p.x, p.y); if (n !== hover) { hover = n; kick(); }
    cv.style.cursor = n ? "pointer" : live ? "grab" : "pointer";
    if (n) card(n, p.x, p.y, false); else if (sel) { const q = toScreen(sel.x, sel.y); card(sel, q.x, q.y, true); } else card(null);
  });
  function up(e) {
    const p = pos(e), wasTap = !moved, touch = e.pointerType === "touch";
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
    if (touch && !live && wasTap) { setLive(true); const n = pick(p.x, p.y); if (n) select(n); down = null; return; }
    if (drag) { const n = drag; drag = null; n.fixed = false; if (wasTap) { setLive(true); select(n === sel ? null : n); } else reheat(0.15); }
    else if (wasTap && down) { if (!live) setLive(true); else if (sel) select(null); }
    pan = null; down = null; cv.style.cursor = "";
  }
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", (e) => { ptrs.delete(e.pointerId); pinch = null; if (drag) { drag.fixed = false; drag = null; } pan = null; });
  cv.addEventListener("pointerleave", () => { if (!drag && !pan) { hover = null; if (sel) { const q = toScreen(sel.x, sel.y); card(sel, q.x, q.y, true); } else card(null); kick(); } });
  cv.addEventListener("wheel", (e) => { if (!live) return; e.preventDefault(); const p = pos(e), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(p.x, p.y, Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018))); card(null); }, { passive: false });

  // ── keyboard: Enter/Space arms; N walks nodes; arrows pan; +/- zoom; Esc leaves
  cv.addEventListener("keydown", (e) => {
    const k = e.key; let h = true;
    if (k === "n" || k === "N") { kb = (kb + (e.shiftKey ? -1 : 1) + order.length) % order.length; const n = order[kb]; hover = n; const p = toScreen(n.x, n.y); card(n, p.x, p.y, false); announce(n.label + ", " + n.weight + " memories. Enter to open."); }
    else if (k === "Enter" || k === " ") { setLive(true); if (kb >= 0) select(order[kb]); }
    else if (k === "Escape") { if (sel) select(null); else setLive(false); hover = null; card(null); }
    else if (live && k === "ArrowLeft") { tgt.x += 60; userCam = true; } else if (live && k === "ArrowRight") { tgt.x -= 60; userCam = true; }
    else if (live && k === "ArrowUp") { tgt.y += 60; userCam = true; } else if (live && k === "ArrowDown") { tgt.y -= 60; userCam = true; }
    else if (k === "+" || k === "=") zoomAt(W / 2, H / 2, 1.25); else if (k === "-") zoomAt(W / 2, H / 2, 0.8);
    else if (k === "0") { userCam = false; fit(null, false); }
    else h = false;
    if (h) { e.preventDefault(); if (RM()) cam = { ...tgt }; kick(); }
  });
  cv.addEventListener("blur", () => { if (hover && !drag) { hover = null; card(null); kick(); } });
  fig.querySelector(".kg-reset")?.addEventListener("click", () => { sel = null; hover = null; card(null); userCam = false;
    for (const n of nodes) { n.vx += (Math.random() - 0.5) * 6; n.vy += (Math.random() - 0.5) * 6; } reheat(0.5); fit(null, false); });

  // ── lifecycle: lazy start in view, pause off screen, keep crisp on resize
  new IntersectionObserver((en) => { for (const x of en) { visible = x.isIntersecting; if (visible) { start(); kick(); } else { setLive(false); if (sel) select(null); } } }, { threshold: 0.15 }).observe(fig);
  new ResizeObserver(() => { if (started && size()) { if (!userCam) fit(sel && sel.proj ? new Set([sel, ...nb(sel)]) : null, true); draw(performance.now()); kick(); } }).observe(cv);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
  setLive(false);
  // where(label): a node's position in canvas pixels (for automated checks)
  window.KG = { where: (l) => { const n = nodes.find((m) => m.label === l); if (!n) return null; const p = toScreen(n.x, n.y); return { x: p.x, y: p.y }; } };
})();
