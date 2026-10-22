// Home page motion: the markdown-vs-memory demo, count-up stats, the gather animation and the sealed terminal.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Versus demo: hand-kept .md files vs the brain's versions
  const md = $("[data-md]");
  if (md) {
    const DATA = [
      {
        file: "CLAUDE.md",
        lines: [
          { n: 39, dim: true, w: "70%" },
          { n: 40, dim: true, w: "45%" },
          { n: 41, text: "## Deploy" },
          { n: 42, text: "Push to main and it deploys.", stale: true },
          { n: 43, dim: true, w: "60%" },
          { n: 44, dim: true, w: "35%" },
        ],
        versions: [
          { who: "Claude Code", when: "Mon", ver: "v1", text: "Ship to staging first, run the e2e suite, then promote by hand." },
          { who: "Cursor", when: "Tue", ver: "v2", text: "checkout.spec is flaky: rerun it once before calling it broken." },
        ],
      },
      {
        file: "AGENTS.md",
        lines: [
          { n: 14, dim: true, w: "65%" },
          { n: 15, dim: true, w: "40%" },
          { n: 16, dim: true, w: "55%" },
          { n: 17, text: "## Sessions" },
          { n: 18, text: "Store sessions in Redis.", stale: true },
          { n: 19, dim: true, w: "50%" },
        ],
        versions: [
          { who: "Codex", when: "Mon", ver: "v1", text: "Sessions live in SQLite. Redis was only for the old job queue." },
          { who: "Claude Code", when: "Wed", ver: "v2", text: "Redis client removed from the API." },
        ],
      },
      {
        file: "GEMINI.md",
        lines: [
          { n: 5, dim: true, w: "60%" },
          { n: 6, dim: true, w: "35%" },
          { n: 7, dim: true, w: "70%" },
          { n: 8, text: "## Components" },
          { n: 9, text: "Use default exports.", stale: true },
          { n: 10, dim: true, w: "45%" },
        ],
        versions: [
          { who: "Antigravity", when: "Tue", ver: "v1", text: "Named exports only, one component per file." },
        ],
      },
      {
        file: "CLAUDE.md",
        lines: [
          { n: 58, dim: true, w: "55%" },
          { n: 59, dim: true, w: "38%" },
          { n: 60, dim: true, w: "68%" },
          { n: 61, text: "## Tests" },
          { n: 62, text: "Run every test before each commit.", stale: true },
          { n: 63, dim: true, w: "42%" },
        ],
        versions: [
          { who: "Claude Code", when: "Thu", ver: "v1", text: "Run the fast suite locally; CI runs e2e." },
          { who: "Codex", when: "Fri", ver: "v2", text: "Mock the payment API in unit tests." },
        ],
      },
    ];

    const tabs = $$("[role='tab'][data-k]", md);
    const fileEl = $('[data-f="file"]', md);
    const linesEl = $('[data-f="lines"]', md);
    const versEl = $('[data-f="vers"]', md);
    let cur = 0, timer = 0, vTimer = 0, inView = false, hover = false, seq = 0;

    const vItem = (v) => {
      const li = document.createElement("li");
      li.className = "new";
      const h = document.createElement("div");
      h.className = "vh";
      h.textContent = `${v.who} · ${v.when} · ${v.ver}`;
      const t = document.createElement("div");
      t.className = "vt";
      t.textContent = v.text;
      li.append(h, t);
      return li;
    };

    const render = (k) => {
      cur = k;
      const d = DATA[k];
      const id = ++seq;
      clearTimeout(timer);
      clearTimeout(vTimer);
      tabs.forEach((b, j) => b.setAttribute("aria-selected", String(j === k)));
      if (fileEl) fileEl.textContent = d.file;
      if (linesEl) {
        linesEl.replaceChildren();
        for (const l of d.lines) {
          const li = document.createElement("li");
          li.dataset.n = l.n;
          if (l.dim) {
            li.className = "dim";
            li.style.setProperty("--w", l.w);
          } else {
            li.textContent = l.text;
            if (l.stale) li.classList.add("stale");
          }
          linesEl.append(li);
        }
      }
      if (versEl) {
        versEl.replaceChildren();
        if (reduce) {
          for (const v of d.versions) versEl.append(vItem(v));
        } else {
          const add = (i) => {
            if (id !== seq) return;
            if (i >= d.versions.length) return;
            versEl.append(vItem(d.versions[i]));
            if (i + 1 < d.versions.length) {
              const ph = document.createElement("li");
              const s = document.createElement("span");
              s.className = "saving";
              s.textContent = "Saving…";
              ph.append(s);
              versEl.append(ph);
              vTimer = setTimeout(() => { if (id !== seq) return; ph.replaceWith(vItem(d.versions[i + 1])); add(i + 2); }, 600);
            }
          };
          add(0);
        }
      }
      schedule();
    };

    const schedule = () => {
      clearTimeout(timer);
      if (reduce || !inView || hover) return;
      timer = setTimeout(() => render((cur + 1) % DATA.length), 6000);
    };

    tabs.forEach((b) => b.addEventListener("click", () => render(+b.dataset.k)));
    md.addEventListener("pointerenter", () => { hover = true; clearTimeout(timer); });
    md.addEventListener("pointerleave", () => { hover = false; schedule(); });
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) schedule(); else clearTimeout(timer);
    }, { threshold: 0.3 }).observe(md);
    render(0);
  }

  // ── Count-up numbers
  const nums = $$(".home [data-count]");
  if (nums.length) {
    const run = (el) => {
      const target = Number(el.dataset.count) || 0;
      const dec = Number(el.dataset.dec) || 0;
      const suffix = el.dataset.suffix || "";
      const fmt = (v) => v.toFixed(dec) + suffix;
      if (reduce) { el.textContent = fmt(target); return; }
      const t0 = performance.now(), DUR = 1200;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / DUR);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = fmt(target);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((es, obs) => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        obs.unobserve(e.target);
        run(e.target);
      }
    }, { threshold: 0.4 });
    nums.forEach((n) => io.observe(n));
  }

  // ── Gather: sources lighting up into the core
  const gather = $('[data-own="gather"]');
  if (gather) {
    const srcs = $$(".g-src", gather);
    const lines = $$(".g-lines line", gather);
    const nEl = $('[data-f="n"]', gather);
    const paint = (n) => {
      srcs.forEach((s, i) => s.classList.toggle("on", i < n));
      lines.forEach((l, i) => l.classList.toggle("on", i < n));
      if (nEl) nEl.textContent = String(n);
    };
    if (reduce) {
      paint(4);
    } else {
      let step = 0, running = false, timer = 0;
      const tick = () => {
        if (!running) return;
        if (step >= 4) {
          timer = setTimeout(() => {
            if (!running) return;
            step = 0;
            paint(0);
            tick();
          }, 2500);
          return;
        }
        step++;
        paint(step);
        timer = setTimeout(tick, 800);
      };
      new IntersectionObserver(([e]) => {
        const now = e.isIntersecting;
        if (now && !running) {
          running = true;
          tick();
        } else if (!now && running) {
          running = false;
          clearTimeout(timer);
        }
      }, { threshold: 0.3 }).observe(gather);
      paint(0);
    }
  }

  // ── Seal: type the sync/restore terminal
  const seal = $('[data-own="seal"]');
  const term = seal && $('[data-f="term"]', seal);
  if (term) {
    const LINES = [
      { p: true, t: "brain sync" },
      { t: "✓ 1,284 memories snapshotted" },
      { t: "✓ age-encrypted with your key (Keychain)" },
      { t: "✓ uploaded to your private GitHub repo" },
      { p: true, t: "brain restore   # on your other laptop" },
      { t: "✓ decrypted · 1,284 memories ready" },
    ];
    const out = (row, text) => {
      const ok = document.createElement("span");
      ok.className = "ok";
      ok.textContent = "✓";
      row.append(ok, document.createTextNode(text.slice(1)));
    };
    if (reduce) {
      for (const l of LINES) {
        const row = document.createElement("div");
        row.className = "tl";
        if (l.p) {
          const p = document.createElement("span");
          p.className = "p";
          p.textContent = "$ ";
          row.append(p, document.createTextNode(l.t));
        } else {
          out(row, l.t);
        }
        term.append(row);
      }
    } else {
      let running = false, runId = 0;
      const timers = [];
      const at = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
      const stop = () => {
        running = false;
        runId++;
        while (timers.length) clearTimeout(timers.pop());
        term.replaceChildren();
      };
      const line = (i, id) => {
        if (id !== runId) return;
        if (i >= LINES.length) {
          at(() => {
            if (id !== runId) return;
            term.replaceChildren();
            line(0, id);
          }, 3000);
          return;
        }
        const l = LINES[i];
        const row = document.createElement("div");
        row.className = "tl";
        term.append(row);
        const caret = document.createElement("span");
        caret.className = "caret";
        if (l.p) {
          const p = document.createElement("span");
          p.className = "p";
          p.textContent = "$ ";
          row.append(p);
          const node = document.createTextNode("");
          row.append(node, caret);
          let n = 0;
          const tick = () => {
            if (id !== runId) return;
            if (n >= l.t.length) {
              caret.remove();
              at(() => line(i + 1, id), 500);
              return;
            }
            node.textContent = l.t.slice(0, ++n);
            at(tick, 25);
          };
          at(tick, 25);
        } else {
          out(row, l.t);
          row.append(caret);
          at(() => {
            if (id !== runId) return;
            caret.remove();
            line(i + 1, id);
          }, 500);
        }
      };
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) {
          running = true;
          line(0, runId);
        } else if (!e.isIntersecting && running) {
          stop();
        }
      }, { threshold: 0.3 }).observe(seal);
    }
  }
})();
