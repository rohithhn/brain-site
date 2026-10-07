// Scroll choreography. Each pinned scene gets a 0→1 progress value from its position, written to a
// CSS custom property; CSS does most of the rest. The brain canvas is steered per section.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const Brain = window.Brain || { setTarget() {} };

  // Headline decodes from noise: every character cycles through glyphs, then settles left to right.
  const GLYPHS = "!<>-_\\/[]{}=+*^?#01ABCDEFabcdef";
  for (const h of $$(".decode")) {
    const chars = [];
    const walk = (node) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          // Words are unbreakable groups; the spaces between them stay plain text so lines wrap normally.
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (!part.trim()) { frag.append(document.createTextNode(" ")); return; }
            const wd = document.createElement("span");
            wd.className = "wd"; wd.setAttribute("aria-hidden", "true");
            for (const c of part) {
              const sp = document.createElement("span");
              sp.className = "ch"; sp.textContent = c;
              wd.append(sp);
              chars.push([sp, c]);
            }
            frag.append(wd);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      }
    };
    walk(h);
    if (!reduce) {
      const t0 = performance.now() + 150;
      const tick = (t) => {
        let busy = false;
        chars.forEach(([sp, c], i) => {
          const settle = t0 + 300 + i * 32;
          if (t < settle) {
            busy = true;
            sp.textContent = t < t0 + i * 12 ? "\u00a0" : GLYPHS[(Math.random() * GLYPHS.length) | 0];
            sp.classList.add("scr");
          } else if (sp.textContent !== c) { sp.textContent = c; sp.classList.remove("scr"); }
        });
        if (busy) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }
  requestAnimationFrame(() => document.body.classList.add("ready"));

  // Headings that light up word by word as they scroll through the screen.
  const reveals = $$(".reveal").map((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(" ");
    return { el, words: $$(".w", el) };
  });

  // Terminal lines type in one after another.
  for (const pane of $$(".term .pane")) [...pane.children].forEach((c, i) => c.style.setProperty("--i", i));

  // Logo strip loops seamlessly: two copies of the same row.
  const mt = $(".marquee-track");
  if (mt && !mt.dataset.dup) { mt.dataset.dup = 1; mt.innerHTML += mt.innerHTML.replace(/<span>/g, '<span aria-hidden="true">'); }

  // Cursor spotlight on surfaces, a little tilt on the rail cards.
  addEventListener("pointermove", (e) => {
    const el = e.target.closest && e.target.closest(".spot");
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    el.style.setProperty("--mx", x + "px"); el.style.setProperty("--my", y + "px");
    if (el.classList.contains("panel") && !reduce) {
      el.style.setProperty("--ry", ((x / r.width - 0.5) * 8).toFixed(2) + "deg");
      el.style.setProperty("--rx", ((0.5 - y / r.height) * 8).toFixed(2) + "deg");
    }
  }, { passive: true });
  for (const p of $$(".panel")) p.addEventListener("pointerleave", () => { p.style.setProperty("--rx", "0deg"); p.style.setProperty("--ry", "0deg"); });

  // Magnetic buttons.
  if (!reduce) for (const b of $$(".magnet")) {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.transition = "background .2s, box-shadow .2s";
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
    });
    b.addEventListener("pointerleave", () => { b.style.transition = "background .2s, box-shadow .2s, transform .5s cubic-bezier(.2,.8,.2,1)"; b.style.transform = ""; });
  }

  // ── Tools scene: tool chips around a core, wired in with SVG.
  // [name, x, y, kind, logo, brand colour when lit]
  const TOOLS = [
    ["Claude Code", 0.1, 0.14, "full", "claudecode", "#d97757"], ["Codex", 0.06, 0.42, "full", "codex", "#ffffff"],
    ["Antigravity", 0.1, 0.72, "full", "antigravity", "#4f8dfd"], ["Gemini CLI", 0.9, 0.14, "full", "geminicli", "#4796e3"],
    ["Cursor", 0.94, 0.42, "part", "cursor", "#ffffff"], ["Claude Desktop", 0.88, 0.72, "pull", "claude", "#d97757"],
    ["ChatGPT desktop", 0.5, 0.95, "pull", "openai", "#ffffff"],
  ];
  const wire = $(".wire"), svg = $(".wires");
  const wires = [];
  if (wire && svg) {
    const NS = "http://www.w3.org/2000/svg";
    const CX = 500, CY = 270;
    TOOLS.forEach(([name, fx, fy, kind, logo, brand], i) => {
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
      chip.style.setProperty("--brand", brand);
      chip.innerHTML = `<svg><use href="#l-${logo}"/></svg>${name}`;
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
    hero: () => (small() ? { x: 0.5, y: 0.8, scale: 0.42, alpha: 0.5 } : { x: 0.73, y: 0.46, scale: 0.29, alpha: 1 }),
    loop: () => (small() ? { x: 0.5, y: 0.5, scale: 0.55, alpha: 0.28 } : { x: 0.5, y: 0.52, scale: 0.6, alpha: 0.3 }),
    // Phones: behind dense tables the brain is barely visible, so it fades out and stops drawing.
    dim: () => ({ x: 0.5, y: 0.5, scale: small() ? 0.55 : 0.6, alpha: small() ? 0 : 0.18 }),
    vault: () => (small() ? { x: 0.5, y: 0.5, scale: 0.5, alpha: 0.2 } : { x: 0.5, y: 0.5, scale: 0.6, alpha: 0.16 }),
    install: () => ({ x: 0.5, y: 0.5, scale: small() ? 0.55 : 0.5, alpha: 0.4 }),
  };
  const LOOP_REGION = [2, 0, 1, 3, 4]; // capture→temporal, distill→frontal, rank→parietal, inject→occipital, measure→cerebellum

  const steps = $$(".steps li"), panes = $$(".loop-term .pane");
  const stages = $$(".stage"), packet = $(".packet"), pipe = $(".pipe"), cipher = $("[data-cipher]");
  let lastStep = -1;

  const progress = (el) => {
    const r = el.getBoundingClientRect();
    const span = r.height - innerHeight;
    return span > 0 ? clamp(-r.top / span) : clamp((innerHeight - r.top) / (innerHeight + r.height));
  };

  // Scroll progress goes only on the few elements that draw with it (never on whole sections or
  // the root, which would make the browser restyle everything inside on every scroll step).
  const setP = (sec, p) => {
    const v = p.toFixed(3);
    if (sec._p === v) return;
    sec._p = v;
    (sec._pt ||= [...sec.querySelectorAll(".hero-copy, .steps, .pipe, .route")]).forEach((e) => e.style.setProperty("--p", v));
  };
  const bar = document.querySelector(".progress span");
  const setPage = () => {
    const d = document.documentElement;
    if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, scrollY / (d.scrollHeight - innerHeight || 1))).toFixed(4)})`;
  };
  const update = () => {
    if (!document.querySelector("[data-b]")) setPage();  // story.js owns the bar when both run
    $(".nav").classList.toggle("solid", scrollY > 30);

    for (const s of $$("[data-scene]")) setP(s, progress(s));

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
        const sealed = at >= 3;
        packet.classList.toggle("sealed", sealed);
        // Before the age stage the packet is a readable file; after it, ciphertext that never sits still.
        const label = sealed ? Array.from({ length: 3 }, () => Math.random().toString(16).slice(2, 6)).join("·") : at >= 2 ? "brain.tar" : "memory.db";
        if (!sealed || !reduce) cipher.textContent = label;
      }
    }

    // Headings light word by word between 90% and 40% of the screen height.
    for (const { el, words } of reveals) {
      const r = el.getBoundingClientRect();
      const k = clamp((innerHeight * 0.9 - r.top) / (innerHeight * 0.5));
      const n = reduce ? words.length : Math.round(k * words.length);
      words.forEach((w, i) => w.classList.toggle("lit", i < n));
    }

    // Rail.
    if (rail && track && !small()) {
      const travel = +rail.dataset.travel || 0;
      track.style.transform = `translateX(${-progress(rail) * travel}px)`;
    }

    // Brain: follow whichever section holds the middle of the screen.
    // A page may also carry story sections (data-b); then the brain is only steered here while a
    // data-brain section holds the middle of the screen.
    let mode = document.querySelector("[data-b]") ? null : "hero";
    for (const s of $$("[data-brain]")) {
      const r = s.getBoundingClientRect();
      if (r.top <= innerHeight * 0.5 && r.bottom > innerHeight * 0.5) { mode = s.dataset.brain; break; }
    }
    if (!mode) {
      // story.js has the brain
    } else if (mode === "tools") {
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

})();
