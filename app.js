// Scroll choreography. Each pinned scene gets a 0→1 progress value from its position, written to a
// CSS custom property; CSS does most of the rest. The brain canvas is steered per section.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const Brain = window.Brain || { setTarget() {} };

  // Split the headline into words so they can rise one by one.
  for (const el of $$(".split")) {
    el.innerHTML = el.innerHTML
      .split(/(<em>.*?<\/em>|\s+)/)
      .filter((w) => w && !/^\s+$/.test(w))
      .map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`)
      .join(" ");
  }
  requestAnimationFrame(() => document.body.classList.add("ready"));

  // ── Tools scene: tool chips around a core, wired in with SVG.
  const TOOLS = [
    ["Claude Code", 0.1, 0.14, "full"], ["Codex", 0.06, 0.42, "full"], ["Antigravity", 0.1, 0.72, "full"],
    ["Gemini CLI", 0.9, 0.14, "full"], ["Cursor", 0.94, 0.42, "part"],
    ["Claude Desktop", 0.88, 0.72, "pull"], ["ChatGPT desktop", 0.5, 0.95, "pull"],
  ];
  const wire = $(".wire"), svg = $(".wires");
  const wires = [];
  if (wire && svg) {
    const NS = "http://www.w3.org/2000/svg";
    const CX = 500, CY = 270;
    TOOLS.forEach(([name, fx, fy, kind], i) => {
      const x = fx * 1000, y = fy * 560;
      const d = `M${x} ${y} C${(x + CX) / 2} ${y}, ${(x + CX) / 2} ${CY}, ${CX} ${CY}`;
      const base = document.createElementNS(NS, "path");
      base.setAttribute("d", d); base.setAttribute("pathLength", "1"); base.setAttribute("class", `w-line ${kind}`);
      const sig = document.createElementNS(NS, "path");
      sig.setAttribute("d", d); sig.setAttribute("pathLength", "1"); sig.setAttribute("class", `w-sig ${kind}`);
      sig.style.animationDelay = `${-i * 0.37}s`;
      svg.append(base, sig);
      const chip = document.createElement("span");
      chip.className = `chip ${kind}`;
      chip.style.left = fx * 100 + "%"; chip.style.top = fy * 100 + "%";
      chip.innerHTML = `<i></i>${name}`;
      wire.append(chip);
      wires.push({ base, sig, chip });
    });
  }

  // ── Rail: the section is as tall as the track is wide, so vertical scroll maps to horizontal travel.
  const rail = $(".rail"), track = $(".track");
  const sizeRail = () => {
    if (!rail || !track) return;
    if (innerWidth < 760) { rail.style.height = ""; return; }
    const travel = Math.max(0, track.scrollWidth - innerWidth + 64);
    rail.style.height = `${innerHeight + travel}px`;
    rail.dataset.travel = travel;
  };

  // Where the brain sits for each kind of section.
  const small = () => innerWidth < 760;
  const SPOTS = {
    hero: () => (small() ? { x: 0.5, y: 0.86, scale: 0.42, alpha: 0.5 } : { x: 0.7, y: 0.5, scale: 0.31, alpha: 1 }),
    loop: () => (small() ? { x: 0.5, y: 0.5, scale: 0.55, alpha: 0.28 } : { x: 0.5, y: 0.52, scale: 0.6, alpha: 0.3 }),
    dim: () => ({ x: 0.5, y: 0.5, scale: small() ? 0.55 : 0.6, alpha: 0.18 }),
    vault: () => (small() ? { x: 0.5, y: 0.5, scale: 0.5, alpha: 0.2 } : { x: 0.74, y: 0.5, scale: 0.36, alpha: 0.3 }),
    install: () => ({ x: 0.5, y: 0.42, scale: small() ? 0.55 : 0.5, alpha: 0.32 }),
  };
  const LOOP_REGION = [2, 0, 1, 3, 4]; // capture→temporal, distill→frontal, rank→parietal, inject→occipital, measure→cerebellum

  const steps = $$(".steps li"), panes = $$(".loop-term .pane");
  const stages = $$(".stage"), packet = $(".packet"), pipe = $(".pipe");
  let lastStep = -1;

  const progress = (el) => {
    const r = el.getBoundingClientRect();
    const span = r.height - innerHeight;
    return span > 0 ? clamp(-r.top / span) : clamp((innerHeight - r.top) / (innerHeight + r.height));
  };

  const update = () => {
    const doc = document.documentElement;
    doc.style.setProperty("--page", clamp(scrollY / (doc.scrollHeight - innerHeight || 1)));
    $(".nav").classList.toggle("solid", scrollY > 30);

    for (const s of $$("[data-scene]")) s.style.setProperty("--p", progress(s).toFixed(4));

    // Loop steps.
    const loop = $(".loop");
    const lp = loop ? progress(loop) : 0;
    const step = Math.min(steps.length - 1, Math.floor(lp * steps.length * 0.999));
    if (step !== lastStep && !small()) {
      lastStep = step;
      steps.forEach((li, i) => li.classList.toggle("on", i === step));
      panes.forEach((p, i) => p.classList.toggle("on", i === step));
    }

    // Tools wiring.
    const tools = $(".tools");
    const tp = tools ? (small() ? 1 : progress(tools)) : 0;
    wires.forEach((w, i) => {
      const k = clamp(tp * 2.2 - i * 0.12);
      w.base.style.strokeDashoffset = 1 - k;
      w.chip.classList.toggle("lit", k >= 1);
      w.sig.classList.toggle("on", k >= 1);
    });

    // Vault pipeline.
    const vault = $(".vault");
    if (vault && stages.length) {
      const vp = small() ? 1 : progress(vault);
      const at = vp * (stages.length - 0.001);
      stages.forEach((s, i) => s.classList.toggle("lit", i <= at));
      if (packet && pipe && !small()) {
        const i = Math.min(stages.length - 1, Math.floor(at)), f = at - i;
        const a = stages[i], b = stages[Math.min(stages.length - 1, i + 1)];
        const y = a.offsetTop + (b.offsetTop - a.offsetTop) * f + a.offsetHeight / 2;
        packet.style.transform = `translateY(${y}px)`;
        packet.classList.toggle("sealed", at >= 3);
      }
    }

    // Rail.
    if (rail && track && !small()) {
      const travel = +rail.dataset.travel || 0;
      track.style.transform = `translateX(${-progress(rail) * travel}px)`;
    }

    // Brain: follow whichever section holds the middle of the screen.
    let mode = "hero";
    for (const s of $$("[data-brain]")) {
      const r = s.getBoundingClientRect();
      if (r.top <= innerHeight * 0.5 && r.bottom > innerHeight * 0.5) { mode = s.dataset.brain; break; }
    }
    if (mode === "tools") {
      const core = $(".core");
      const r = core.getBoundingClientRect();
      Brain.setTarget({ x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight,
        scale: small() ? 0.13 : 0.15, alpha: 1, region: -1 });
    } else {
      Brain.setTarget({ ...(SPOTS[mode] || SPOTS.dim)(), region: mode === "loop" ? LOOP_REGION[Math.max(0, step)] : -1 });
    }
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { sizeRail(); update(); });
  addEventListener("load", () => { sizeRail(); update(); });
  sizeRail();
  update();

  // Count-ups and fades when they enter the viewport.
  const countUp = (el) => {
    const end = +el.dataset.count, dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || "";
    const fmt = (v) => v.toFixed(dec) + suf;
    if (reduce || end === 0) { el.textContent = fmt(end); return; }
    const t0 = performance.now();
    const tick = (t) => {
      const k = clamp((t - t0) / 1500), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(end * e);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add("in");
      const n = $("[data-count]", en.target);
      if (n) countUp(n);
      io.unobserve(en.target);
    }
  }, { threshold: 0.3 });
  $$(".stat, .fade").forEach((el) => io.observe(el));

  // Copy buttons.
  for (const b of $$("[data-copy]")) {
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        b.textContent = "Copied";
      } catch { b.textContent = "Select & copy"; }
      setTimeout(() => (b.textContent = "Copy"), 1600);
    });
  }
})();
