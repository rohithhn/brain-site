"""Assemble the story pages from _src/*.body.html with the shared head, sprite, nav and scripts.
Run from the repo root: python3 _src/build.py [--artifact OUTDIR]"""
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
index = (root / "_src" / "overview.html").read_text()  # the overview page supplies reusable sections
sprite = re.search(r'<svg width="0" height="0".*?</svg>', index, re.S).group(0)
fonts = '\n'.join(l for l in index.splitlines() if 'fonts.g' in l)
icon = re.search(r'<link rel="icon".*?<link rel="apple-touch-icon"[^>]*>', index).group(0)
CUR = ' aria-current="page"'
PAGES = [("index", "Main"), ("week", "A week"), ("voice", "I remember"), ("journey", "One memory")]
TABS = [("blog", "Blog"), ("privacy", "Privacy"), ("contact", "Contact")]
TAB_HREF = {"blog": "blog/index.html"}  # the blog is its own folder (see _src/blog)
BUILT = [n for n, _ in TABS if n != "blog"]
CREDIT = "Built by Rohith, Chandan and Sushmita"
REPO = "https://github.com/rohithhn/Ultra-Agentic-Memory-and-Brain-Public"
GH = f'<a class="gh" href="{REPO}" aria-label="Agentic Brain on GitHub"><svg><use href="#l-github"/></svg><span>GitHub</span></a>'
ENTRY = "index"  # in an artifact this page is the root page; the rest are files beside it


# Google Analytics 4 (G-DXSD8QT2SN) via the Google tag, top of <head> on every page, blog included.
# Basic consent mode: gtag.js is only fetched once the visitor has accepted (now or on an earlier visit),
# so nothing reaches Google before Accept. The banner below calls abLoadGA() on Accept.
GA_ID = "G-DXSD8QT2SN"
GTM_HEAD = """<!-- Google tag (gtag.js), loaded only after cookie consent -->
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});
window.abLoadGA=function(){if(window.abGA)return;window.abGA=1;gtag('consent','update',{analytics_storage:'granted'});
var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-DXSD8QT2SN';document.head.appendChild(s);
gtag('js',new Date());gtag('config','G-DXSD8QT2SN');};
try{if(localStorage.getItem('ab-consent')==='granted')abLoadGA();}catch(e){}</script>"""
# Cookie banner: shown until the visitor chooses; Accept grants analytics_storage, Decline keeps it denied.
# Any element with data-consent-reset (e.g. on the privacy page) clears the choice and shows it again.
CONSENT = """<div class="ab-consent" role="dialog" aria-live="polite" aria-label="Cookie choice" hidden>
<p>We use cookies to count visits and see which pages are read. Nothing else, and only if you agree. <a href="{root}privacy.html">Privacy</a></p>
<div><button type="button" data-c="denied">Decline</button><button type="button" data-c="granted" class="ok">Accept</button></div>
</div>
<style>
.ab-consent{position:fixed;z-index:9999;left:16px;right:16px;bottom:max(16px,env(safe-area-inset-bottom));margin:0 auto;max-width:560px;
display:flex;gap:16px;align-items:center;justify-content:space-between;padding:14px 16px;border-radius:14px;background:#0b0c0f;color:#c9ced8;
border:1px solid rgba(255,255,255,.12);box-shadow:0 18px 50px rgba(0,0,0,.6);font:14px/1.5 Inter,system-ui,sans-serif}
.ab-consent[hidden]{display:none}.ab-consent p{margin:0}.ab-consent a{color:#8fd3ff}
.ab-consent div{display:flex;gap:8px;flex:none}
.ab-consent button{font:500 13px Inter,system-ui,sans-serif;padding:8px 14px;border-radius:9px;cursor:pointer;border:1px solid rgba(255,255,255,.18);background:transparent;color:#e7eaf0}
.ab-consent button.ok{background:#f3f5f8;color:#000;border-color:#f3f5f8}
@media (max-width:520px){.ab-consent{flex-direction:column;align-items:stretch}.ab-consent div button{flex:1}}
</style>
<script>(function(){var b=document.querySelector('.ab-consent');if(!b)return;
function get(){try{return localStorage.getItem('ab-consent')}catch(e){return null}}
function set(v){try{localStorage.setItem('ab-consent',v)}catch(e){}}
if(!get())b.hidden=false;
b.addEventListener('click',function(e){var v=e.target.getAttribute&&e.target.getAttribute('data-c');if(!v)return;
set(v);if(v==='granted')abLoadGA();else gtag('consent','update',{analytics_storage:'denied'});b.hidden=true;});
document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[data-consent-reset]');if(!t)return;
e.preventDefault();try{localStorage.removeItem('ab-consent')}catch(_){}gtag('consent','update',{analytics_storage:'denied'});b.hidden=false;});
})();</script>"""
def with_gtm(html, root=""):
    if GA_ID in html or "<body" not in html:
        return html
    html = html.replace("<head>\n", "<head>\n" + GTM_HEAD + "\n", 1)
    j = html.rindex("</body>")
    return html[:j] + CONSENT.replace("{root}", root) + "\n" + html[j:]

def index_section(n):
    """Section n of index.html: from its `<!-- n · ` comment to the next section comment."""
    m = re.search(rf"<!-- {n} · .*?-->\n(.*?)(?=\n<!-- \d+ · |\n</main>)", index, re.S)
    return m.group(1)

artifact = "--artifact" in sys.argv
out = pathlib.Path(sys.argv[sys.argv.index("--artifact") + 1]) if artifact else root

pages = PAGES + [t for t in TABS if t[0] in BUILT]
if artifact:
    pages = [p for p in pages if p[0] == ENTRY] + [t for t in TABS if t[0] in BUILT]
for name, label in pages:
    body = (root / "_src" / f"{name}.body.html").read_text()
    title = re.search(r"<!--TITLE:(.*?)-->", body).group(1)
    desc = re.search(r"<!--DESC:(.*?)-->", body).group(1)
    m = re.search(r"<!--SCRIPTS:(.*?)-->", body)
    scripts = m.group(1).split() if m else ["story.js"]
    body = re.sub(r"<!--PART:([\w.-]+)-->", lambda m: (root / "_src" / f"{m.group(1)}.html").read_text(), body)
    body = re.sub(r"<!--INDEX:(\d+)-->", lambda m: index_section(m.group(1)), body)
    for old, new in re.findall(r"<!--REPLACE:(.*?)\|\|\|(.*?)-->", body, re.S):
        assert body.count(old) >= 2, f"{name}: replacement target not found: {old[:60]}"
        body = body.replace(old, new)
    body = re.sub(r"<!--(TITLE|DESC|SCRIPTS|REPLACE):.*?-->\n?", "", body, flags=re.S)
    home = "./" if artifact else "index.html"
    tabs = "".join(f'<a href="{TAB_HREF.get(n, n + ".html")}"{CUR if n == name else ""}>{l}</a>' for n, l in TABS)
    switch = "" if artifact or name in dict(TABS) or name == "index" else '<nav class="switch" aria-label="Stories">' + "".join(
        f'<a href="{n}.html"{CUR if n == name else ""}>{l}</a>' for n, l in PAGES) + "</nav>"
    head = f"""<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#000000">
{icon}
{fonts}
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="story.css">"""
    main = f"""{sprite}
<canvas id="brain" aria-hidden="true"></canvas>
<div class="vignette" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>
<div class="progress" aria-hidden="true"><span></span></div>
<header class="nav">
  <a class="brand" href="{home}"><span class="logo"><svg class="mark"><use href="#i-mark"/></svg></span>Agentic Brain</a>
  <nav>{tabs}{GH}<span class="soon-pill live"><i></i>Open source · Apache-2.0</span></nav>
</header>
<main>
{body}
</main>
{switch}
<footer class="foot">
  <span class="brand small"><svg class="mark"><use href="#i-mark"/></svg>Agentic Brain</span>
  <span>{CREDIT}</span>
  <span>Open source (Apache-2.0), self-hosted memory for AI coding tools.</span>
  {GH}
  <a href="mailto:agenticbrain@zohomail.in">agenticbrain@zohomail.in</a>
</footer>
<script src="brain.js"></script>
{chr(10).join(f'<script src="{s}"></script>' for s in scripts)}"""
    if artifact and name == ENTRY:
        html = head + "\n" + main
    else:
        html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{head}
</head>
<body>
{main}
</body>
</html>
"""
    if not artifact:
        html = with_gtm(html)
    (out / f"{name}.html").write_text(html)
    print("wrote", out / f"{name}.html")

# ── Blog: _src/blog/*.html -> blog/ (one level down, so shared assets get ../)
if not artifact:
    blog_head = "\n".join([
        icon.replace('href="img/', 'href="../img/'),
        fonts,
        '<link rel="stylesheet" href="blog.css">',
    ])
    (root / "blog").mkdir(exist_ok=True)
    for f in sorted((root / "_src" / "blog").glob("*.html")):
        html = f.read_text().replace("{{HEAD}}", blog_head).replace("{{SPRITE}}", sprite)
        html = with_gtm(html, "../")
        (root / "blog" / f.name).write_text(html)
        print("wrote", root / "blog" / f.name)
    # old /blog.html links keep working
    (root / "blog.html").write_text('<!doctype html><meta charset="utf-8"><title>Agentic Brain Blog</title>'
        '<link rel="canonical" href="https://rohithhn.github.io/brain-site/blog/">'
        '<meta http-equiv="refresh" content="0; url=blog/index.html"><a href="blog/index.html">Blog</a>')
