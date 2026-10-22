// Site shell: sidebar drawer on phones, "On this page" built from [data-toc] with scroll-spy, the launch video
// (YouTube loads only after a click), the "same question in every tool" demo, and copy buttons.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Menu
  const menu = $(".topnav .menu");
  if (menu) {
    const set = (o) => {
      document.documentElement.classList.toggle("menu-open", o);
      menu.setAttribute("aria-expanded", o);
    };
    menu.addEventListener("click", () => set(!document.documentElement.classList.contains("menu-open")));
    $("#tn-links")?.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  }

  // ── On this page
  const marks = $$("main [data-toc]");
  const toc = $(".toc");
  if (toc && marks.length > 1) {
    toc.closest(".toc-wrap").hidden = false;
    const links = marks.map((m) => {
      const a = document.createElement("a");
      a.href = "#" + m.id;
      a.textContent = m.dataset.toc;
      toc.append(a);
      return a;
    });
    let cur = -1, ticking = false;
    const spy = () => {
      ticking = false;
      let i = 0;
      marks.forEach((m, k) => { if (m.getBoundingClientRect().top <= innerHeight * 0.5) i = k; });
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) i = marks.length - 1;
      if (i === cur) return;
      cur = i;
      links.forEach((a, k) => a.classList.toggle("on", k === i));
      const box = toc.closest(".side-scroll"), a = links[i];
      if (box && a && innerWidth >= 1080) {
        const r = a.getBoundingClientRect(), b = box.getBoundingClientRect();
        if (r.top < b.top + 20 || r.bottom > b.bottom - 20) box.scrollBy({ top: r.top - b.top - b.height / 3, behavior: "smooth" });
      }
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    addEventListener("resize", spy);
    spy();
  }

  // ── Launch video
  const modal = $("#vmodal");
  if (modal) {
    const frame = $(".vframe", modal);
    let back = null;
    const open = (from) => {
      back = from;
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${modal.dataset.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      f.title = "Open Agentic Brain and Memory launch video";
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      frame.replaceChildren(f);
      modal.hidden = false;
      document.documentElement.style.overflow = "hidden";
      $(".vmodal-x", modal).focus();
    };
    const close = () => {
      if (modal.hidden) return;
      modal.hidden = true;
      frame.replaceChildren();
      document.documentElement.style.overflow = "";
      back?.focus({ preventScroll: true });
    };
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-video]");
      if (t) { e.preventDefault(); open(t); return; }
      if (!modal.hidden && (e.target === modal || e.target.closest(".vmodal-x"))) close();
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  // ── Same question, every tool
  const ag = $("[data-agents]");
  if (ag) {
    const TOOLS = [
      { tool: "Claude Code", file: "CLAUDE.md", ph: "Reply to Claude Code…",
        ans: "Staging first, run the e2e suite, then promote to production by hand. You decided that here on Monday. Cursor noted on Tuesday that checkout.spec is flaky, so rerun it once before calling it broken." },
      { tool: "Codex", file: "AGENTS.md", ph: "Ask Codex…",
        ans: "Ship to staging, run the e2e suite, then promote by hand. That's the rule you set in Claude Code on Monday. Heads-up from your Cursor session on Tuesday: checkout.spec is flaky, rerun it once." },
      { tool: "Cursor", file: "AGENTS.md (this repo)", ph: "Ask Cursor…",
        ans: "Staging, then the e2e suite, then a manual promote, per Monday's decision in Claude Code. You flagged checkout.spec as flaky here on Tuesday, so I'll rerun it once if it fails." },
    ];
    const tabs = $$("[data-ag]", ag), f = (k) => $(`[data-f="${k}"]`, ag);
    const DUR = 7000;
    ag.style.setProperty("--agt", DUR + "ms");
    let i = 0, timer = 0, typer = 0, inView = false, hover = false;
    const type = (el, text) => {
      clearInterval(typer);
      if (reduce) { el.textContent = text; return; }
      let n = 0;
      el.textContent = "";
      el.classList.add("typing");
      typer = setInterval(() => {
        n += 2;
        el.textContent = text.slice(0, n);
        if (n >= text.length) { clearInterval(typer); el.classList.remove("typing"); }
      }, 18);
    };
    const show = (k) => {
      i = k;
      const t = TOOLS[k];
      tabs.forEach((b, j) => {
        b.setAttribute("aria-selected", j === k);
        const bar = $(".ag-bar", b);
        if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
      });
      f("tool").textContent = t.tool; f("file").textContent = t.file; f("ph").textContent = t.ph;
      type(f("ans"), t.ans);
      schedule();
    };
    const schedule = () => {
      clearTimeout(timer);
      if (reduce || !inView || hover) return;
      timer = setTimeout(() => show((i + 1) % TOOLS.length), DUR);
    };
    const pause = (p) => { ag.classList.toggle("paused", p); p ? clearTimeout(timer) : schedule(); };
    tabs.forEach((b) => b.addEventListener("click", () => show(+b.dataset.ag)));
    ag.addEventListener("pointerenter", () => { hover = true; pause(true); });
    ag.addEventListener("pointerleave", () => { hover = false; pause(false); });
    new IntersectionObserver(([e]) => {
      const was = inView;
      inView = e.isIntersecting;
      if (inView && !was) show(i); else if (!inView) pause(true);
    }, { threshold: 0.35 }).observe(ag);
    f("ans").textContent = TOOLS[0].ans;
  }

  // ── Copy buttons (the ones without their own inline handler)
  for (const b of $$(".copy:not([onclick])")) {
    b.addEventListener("click", () => {
      const c = b.previousElementSibling, done = () => { b.textContent = "Copied"; b.classList.add("ok"); setTimeout(() => { b.textContent = "Copy"; b.classList.remove("ok"); }, 1600); };
      const fallback = () => { const r = document.createRange(); r.selectNodeContents(c); const s = getSelection(); s.removeAllRanges(); s.addRange(r); try { if (document.execCommand("copy")) done(); } catch (e) {} };
      navigator.clipboard && isSecureContext ? navigator.clipboard.writeText(c.textContent).then(done, fallback) : fallback();
    });
  }
})();
