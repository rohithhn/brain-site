// Story engine for the narrative pages. A [data-story] section is pinned while you scroll through it and
// is split into beats: the beat in view gets .on, earlier ones .past. Anything with data-show="a-b" is
// visible (.vis) while the beat index is in a..b. The brain is steered by data-b="x y scale alpha rate
// region" on the active beat, else on its section (data-bm overrides on phones).
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const Brain = window.Brain || { setTarget() {} };
  const small = () => innerWidth < 760;
  const GLYPHS = "!<>-_\\/[]{}=+*^?#01ABCDEFabcdef";

  // ── Decode: characters cycle through glyphs and settle left to right.
  const splitChars = (el) => {
    const chars = [];
    const walk = (node) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (!part.trim()) { frag.append(document.createTextNode(" ")); return; }
            const wd = document.createElement("span");
            wd.className = "wd";
            for (const c of part) {
              const sp = document.createElement("span");
              sp.className = "ch"; sp.textContent = c;
              wd.append(sp); chars.push([sp, c]);
            }
            frag.append(wd);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      }
    };
    walk(el);
    return chars;
  };
  const decode = (el) => {
    if (!el._chars) { el.setAttribute("aria-label", el.textContent.trim()); el._chars = splitChars(el); }
    const chars = el._chars;
    if (reduce) return;
    const run = (el._run = (el._run || 0) + 1);
    const t0 = performance.now();
    const tick = (t) => {
      if (run !== el._run) return;
      let busy = false;
      chars.forEach(([sp, c], i) => {
        if (t < t0 + 200 + i * 22) {
          busy = true;
          sp.textContent = t < t0 + i * 8 ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          sp.classList.add("scr");
        } else if (sp.textContent !== c) { sp.textContent = c; sp.classList.remove("scr"); }
      });
      if (busy) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // ── Typewriter for chat lines and code.
  const type = (el) => {
    const full = el.dataset.text ?? (el.dataset.text = el.textContent);
    if (reduce) { el.textContent = full; return; }
    const run = (el._run = (el._run || 0) + 1);
    const speed = +(el.dataset.speed || 24), delay = +(el.dataset.delay || 0);
    el.textContent = ""; el.classList.add("typing");
    const t0 = performance.now() + delay;
    const tick = (t) => {
      if (run !== el._run) return;
      const n = clamp(Math.floor((t - t0) / speed), 0, full.length);
      el.textContent = full.slice(0, n);
      if (n < full.length) requestAnimationFrame(tick); else el.classList.remove("typing");
    };
    requestAnimationFrame(tick);
  };
  const resetType = (el) => { el._run = (el._run || 0) + 1; if (el.dataset.text != null) el.textContent = ""; };
  for (const el of $$(".type")) { el.dataset.text = el.textContent; el.textContent = ""; }

  // Ciphertext that never sits still while it's on screen.
  const ciphers = $$("[data-cipher]");
  setInterval(() => {
    if (reduce) return;
    for (const el of ciphers) {
      if (!el.offsetParent) continue;
      const len = +el.dataset.cipher || 48;
      let s = "";
      for (let i = 0; i < len; i++) s += "0123456789abcdef"[(Math.random() * 16) | 0] + ((i + 1) % 4 === 0 && i < len - 1 ? (i % 32 === 31 ? "\n" : " ") : "");
      el.textContent = s;
    }
  }, 90);

  // ── Static decode on load + seamless marquee + spotlight.
  for (const el of $$(".decode")) decode(el);
  requestAnimationFrame(() => document.body.classList.add("ready"));
  const mt = $(".marquee-track");
  if (mt) mt.innerHTML += mt.innerHTML.replace(/<span>/g, '<span aria-hidden="true">');
  addEventListener("pointermove", (e) => {
    const el = e.target.closest && e.target.closest(".spot");
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", e.clientX - r.left + "px"); el.style.setProperty("--my", e.clientY - r.top + "px");
  }, { passive: true });

  // ── Stories.
  const stories = $$("[data-story]").map((sec) => {
    const beats = $$(".beat", sec);
    const n = +(sec.dataset.story || beats.length) || 1;
    sec.style.setProperty("--n", n);
    return { sec, beats, n, shows: $$("[data-show]", sec).map((el) => {
      const [a, b] = el.dataset.show.split("-").map(Number);
      return { el, a, b: b === undefined ? a : b };
    }), steps: $$("[data-step]", sec), last: -1 };
  });
  const parseB = (s) => {
    if (!s) return null;
    const [x, y, scale, alpha, rate = 1, region = -1] = s.trim().split(/\s+/).map(Number);
    return { x, y, scale, alpha, rate, region };
  };
  const brainFor = (el) => parseB((small() && el.dataset.bm) || el.dataset.b);

  const progress = (el) => {
    const r = el.getBoundingClientRect();
    const span = r.height - innerHeight;
    return span > 0 ? clamp(-r.top / span) : clamp((innerHeight - r.top) / (innerHeight + r.height));
  };

  const update = () => {
    const doc = document.documentElement;
    doc.style.setProperty("--page", clamp(scrollY / (doc.scrollHeight - innerHeight || 1)));
    const nav = $(".nav");
    if (nav) nav.classList.toggle("solid", scrollY > 30);

    let brain = null;
    for (const st of stories) {
      const p = progress(st.sec);
      const f = p * st.n;
      const i = Math.min(st.n - 1, Math.floor(f * 0.9999));
      st.sec.style.setProperty("--p", p.toFixed(4));
      st.sec.style.setProperty("--bp", clamp(f - i).toFixed(4));
      if (i !== st.last) {
        st.last = i;
        st.sec.dataset.beat = i;
        st.beats.forEach((b, k) => {
          const on = k === i, was = b.classList.contains("on");
          b.classList.toggle("on", on); b.classList.toggle("past", k < i);
          if (on && !was) { for (const d of $$(".decode-on", b)) decode(d); for (const t of $$(".type", b)) type(t); }
          if (!on && was) for (const t of $$(".type", b)) resetType(t);
        });
        for (const s of st.steps) { const k = +s.dataset.step; s.classList.toggle("on", k === i); s.classList.toggle("past", k < i); }
        for (const s of st.shows) {
          const vis = i >= s.a && i <= s.b, was = s.el.classList.contains("vis");
          s.el.classList.toggle("vis", vis);
          if (vis && !was) {
            for (const t of [...$$(".type", s.el), ...(s.el.matches(".type") ? [s.el] : [])]) if (!t.closest(".beat")) type(t);
            for (const d of $$(".decode-on", s.el)) if (!d.closest(".beat")) decode(d);
          }
          if (!vis && was) for (const t of $$(".type", s.el)) if (!t.closest(".beat")) resetType(t);
        }
      }
    }
    // Brain: the section holding the middle of the screen, refined by its active beat.
    for (const sec of $$("[data-b]")) {
      if (sec.classList.contains("beat")) continue;
      const r = sec.getBoundingClientRect();
      if (r.top <= innerHeight * 0.5 && r.bottom > innerHeight * 0.5) {
        const active = $(".beat.on[data-b]", sec);
        brain = brainFor(active || sec);
        break;
      }
    }
    if (brain) Brain.setTarget(brain);
  };

  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }, { passive: true });
  addEventListener("resize", update);
  update();

  // Fades.
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add("in");
      if (en.target.classList.contains("decode-in")) decode(en.target);
      io.unobserve(en.target);
    }
  }, { threshold: 0.3 });
  $$(".fade, .decode-in").forEach((el) => io.observe(el));
})();
