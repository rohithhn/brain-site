"""Assemble the story pages from _src/*.body.html with the shared head, sprite, nav and scripts.
Run from the repo root: python3 _src/build.py [--artifact OUTDIR]"""
import re, sys, pathlib, hashlib

root = pathlib.Path(__file__).resolve().parent.parent

def v(path):
    """Short content hash for cache-busting: style.css -> style.css?v=1a2b3c4d."""
    f = root / path
    return f"{path}?v={hashlib.md5(f.read_bytes()).hexdigest()[:8]}" if f.exists() else path
index = (root / "_src" / "overview.html").read_text()  # the overview page supplies reusable sections
sprite = re.search(r'<svg width="0" height="0".*?</svg>', index, re.S).group(0)
fonts = '\n'.join(l for l in index.splitlines() if 'fonts.g' in l)
icon = re.search(r'<link rel="icon".*?<link rel="apple-touch-icon"[^>]*>', index).group(0)
CUR = ' aria-current="page"'
PAGES = [("index", "Home"), ("story", "The full story"), ("week", "A week"), ("voice", "I remember"), ("journey", "One memory")]
TABS = [("blog", "Blog"), ("privacy", "Privacy"), ("contact", "Contact")]
TAB_HREF = {"blog": "blog/index.html"}  # the blog is its own folder (see _src/blog)
BUILT = [n for n, _ in TABS if n != "blog"]
CREDIT = "Built by Rohith, Chandan and Sushmita"
REPO = "https://github.com/rohithhn/Open-Agentic-Brain-and-Memory"
GH = f'<a class="gh" href="{REPO}" aria-label="Open Agentic Brain and Memory on GitHub"><svg><use href="#l-github"/></svg><span>GitHub</span></a>'
SITE = "https://rohithhn.github.io/brain-site/"
REPO = "https://github.com/rohithhn/Open-Agentic-Brain-and-Memory"
HOME_LD = """<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
 {"@type":"SoftwareApplication","name":"Open Agentic Brain and Memory","url":"https://rohithhn.github.io/brain-site/",
  "description":"Open-source, self-hosted long-term memory shared by AI coding agents: Claude Code, Codex, Cursor, Antigravity CLI and Kilo Code. Captures decisions across sessions and tools, stores them encrypted on your machine and in your own private GitHub, and brings back only what is relevant.",
  "applicationCategory":"DeveloperApplication","operatingSystem":"macOS, Linux","license":"https://www.apache.org/licenses/LICENSE-2.0",
  "offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},
  "downloadUrl":"https://github.com/rohithhn/Open-Agentic-Brain-and-Memory","codeRepository":"https://github.com/rohithhn/Open-Agentic-Brain-and-Memory",
  "image":"https://rohithhn.github.io/brain-site/img/og.png?v=2",
  "author":[{"@type":"Person","name":"Rohith"},{"@type":"Person","name":"Chandan"},{"@type":"Person","name":"Sushmita"}]},
 {"@type":"WebSite","name":"Open Agentic Brain and Memory","url":"https://rohithhn.github.io/brain-site/"}
]}
</script>"""
ENTRY = "index"  # in an artifact this page is the root page; the rest are files beside it

# Launch video and social profiles. An empty URL hides that icon everywhere.
VIDEO_ID = "hHqga63iSIg"
VIDEO_TITLE = "Your AI Agents Forget Everything. This Fixes It (Free)"
SOCIAL = [
    ("youtube", "YouTube", "https://www.youtube.com/@OpenABandM"),
    ("linkedin", "LinkedIn", ""),
    ("x", "X", ""),
    ("instagram", "Instagram", ""),
]
EMAIL = "agenticbrain@zohomail.in"
INSTALL_CMD = "curl -fsSL https://raw.githubusercontent.com/rohithhn/Open-Agentic-Brain-and-Memory/main/install.sh | bash"

# Extra icons for the shell, appended to the overview's sprite (paths from simple-icons, MIT).
SHELL_SYMBOLS = """<symbol id="l-youtube" viewBox="0 0 24 24"><path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></symbol>
<symbol id="l-linkedin" viewBox="0 0 24 24"><path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></symbol>
<symbol id="l-x" viewBox="0 0 24 24"><path fill="currentColor" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></symbol>
<symbol id="l-instagram" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.3"/></g><circle cx="17.6" cy="6.4" r="1.3" fill="currentColor"/></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></symbol>
<symbol id="i-go" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m5 12.5 4.5 4.5L19 7.5"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M7 7l10 10M17 7 7 17"/></symbol>"""
sprite = sprite.replace("</svg>", SHELL_SYMBOLS + "</svg>") if sprite.rstrip().endswith("</svg>") else sprite

# One page per tool: what "supported" means for it, taken from the engine README's tools table.
# (slug, name, icon or "", beta, capture, push, pull, how it is wired, how to check it)
TOOLS = [
    ("claude-code", "Claude Code", "l-claudecode", False,
     "Native. Every session is captured as it happens.", "<code>CLAUDE.md</code>, global, loaded in every project.", "MCP server registered.",
     "The installer registers the brain's MCP server, writes a ~2,000-token briefing into <code>CLAUDE.md</code> inside <code>BRAIN:START/END</code> markers, and captures each session as you work.",
     "Open a new Claude Code session and run <code>/mcp</code>: the brain's tools are listed. Then ask “What should I know before working on this repo?”"),
    ("codex", "Codex", "l-codex", False,
     "Session parser plus a file watcher. The desktop app shares <code>~/.codex/</code>, so it is captured too.", "<code>AGENTS.md</code>, loaded by the CLI and the desktop app.", "MCP server registered in <code>~/.codex/config.toml</code>.",
     "The installer reads your existing Codex history, starts a watcher for new sessions, writes the briefing into <code>AGENTS.md</code> and registers the MCP server for both the CLI and the desktop app.",
     "Start Codex in any repo and ask “What do you remember about this project?” It answers from the briefing, and can search the brain for anything older."),
    ("cursor", "Cursor", "l-cursor", False,
     "Ingested from Cursor's local store.", "Per-repo <code>AGENTS.md</code> only. Cursor's own rules live in its database and are left alone.", "MCP server registered.",
     "The installer ingests your Cursor history and registers the MCP server. Because Cursor has no global instructions file, the briefing goes into each repo's <code>AGENTS.md</code>; a new project starts without it until you wire that repo.",
     "Open Cursor's MCP settings: the brain's server is listed and enabled. Then ask the agent about a decision you made in another tool."),
    ("antigravity", "Antigravity CLI", "l-antigravity", False,
     "Conversation ingest plus a watcher.", "<code>GEMINI.md</code>, loaded in every session.", "MCP server registered.",
     "The installer ingests your Antigravity CLI conversations, watches for new ones, writes the briefing into <code>GEMINI.md</code> and registers the MCP server.",
     "Start a new Antigravity CLI session and ask what it knows about the repo you're in."),
    ("kilo-code", "Kilo Code", "", True,
     "Session parser, in VS Code, Cursor and the CLI.", "<code>~/.config/kilo/AGENTS.md</code>.", "MCP server registered.",
     "Kilo Code support is in beta. The installer parses Kilo sessions, writes the briefing into <code>~/.config/kilo/AGENTS.md</code> and registers the MCP server.",
     "Open Kilo Code and ask what it remembers about this project. If capture goes stale after a Kilo update, <code>brain doctor</code> flags it."),
    ("claude-desktop", "Claude Desktop", "l-claude", False,
     "Not possible. Its conversations live on Anthropic's servers; there is nothing on disk to read.", "None. It doesn't load a local instructions file.", "MCP server registered in <code>claude_desktop_config.json</code>.",
     "Claude Desktop is pull-only: the model can search your brain when it decides to, but its chats don't flow back in. That's an architectural fact, not a roadmap item.",
     "Restart Claude Desktop and look for the brain's tools in the tools menu, then ask it to search your memory."),
    ("chatgpt-desktop", "ChatGPT desktop", "l-openai", False,
     "Not by choice. Its local history is encrypted with a Keychain key, and reading it would mean defeating another vendor's protection.", "None. It doesn't load a local instructions file.", "MCP, through the configuration it shares with Codex (<code>~/.codex/config.toml</code>).",
     "ChatGPT desktop is pull-only. Registering the brain for Codex covers it, so there's nothing extra to install.",
     "Ask ChatGPT desktop to search your brain for a decision you made in Claude Code."),
]


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


# ── Shell: sidebar, phone top bar, announcement, footer, video modal. `r` is the path back to the site root.
def svg(i, cls=""):
    return f'<svg{f" class={chr(34)}{cls}{chr(34)}" if cls else ""} aria-hidden="true"><use href="#{i}"/></svg>'

def socials(cls="social"):
    links = "".join(f'<a href="{u}" aria-label="{l}" title="{l}" rel="me noopener" target="_blank">{svg("l-" + k)}</a>' for k, l, u in SOCIAL if u)
    return f'<div class="{cls}">{links}<a href="{REPO}" aria-label="GitHub" title="GitHub" rel="noopener" target="_blank">{svg("l-github")}</a></div>'

def tool_label(t):
    slug, name, ico, beta = t[:4]
    return (svg(ico) if ico else '<i class="noico">K</i>') + name + ('<small class="beta">beta</small>' if beta else "")

def side(name, r):
    def a(href, label, here=False, extra=""):
        return f'<a href="{href}"{CUR if here else ""}{extra}>{label}</a>'
    tools = "".join(a(f"{r}connect-{t[0]}.html", tool_label(t), name == f"connect-{t[0]}") for t in TOOLS[:5])
    return f"""<aside class="side" id="side" aria-label="Site">
  <div class="side-scroll">
    <div class="toc-wrap" hidden><p class="side-h">On this page</p><nav class="toc" aria-label="On this page"></nav></div>
    <p class="side-h">Product</p>
    <nav aria-label="Product">{a(f"{r}index.html#install", "Install")}{a(f"{r}index.html#numbers", "Benchmarks")}<button type="button" class="side-video" data-video>{svg("i-play")}Launch video<small class="new">new</small></button>{a(REPO, "GitHub" + svg("i-go", "ext"), extra=' rel="noopener"')}</nav>
    <p class="side-h">Connect</p>
    <nav aria-label="Connect" class="tools-nav">{tools}{a(f"{r}connect.html", "All tools", name == "connect")}</nav>
  </div>
  <div class="side-foot">
    <a class="go" href="{r}index.html#install">Install free {svg("i-go")}</a>
    {socials()}
  </div>
</aside>"""

def topnav(name, r):
    def a(href, label, here=False):
        return f'<a href="{href}"{CUR if here else ""}>{label}</a>'
    links = (a(f"{r}index.html", "Home", name == "index")
             + a(f"{r}connect.html", "Connect", name == "connect" or name.startswith("connect-"))
             + a(f"{r}story.html", "Story", name in ("story", "week", "voice", "journey"))
             + a(f"{r}blog/index.html", "Blog", name == "blog")
             + a(f"{r}contact.html", "Contact", name == "contact")
             + f'<a class="tn-gh" href="{REPO}" rel="noopener" aria-label="GitHub">{svg("l-github")}<span>GitHub</span></a>')
    return f"""<header class="nav topnav"><div class="tn-in">
  <a class="brand" href="{r}index.html"><span class="logo"><svg class="mark"><use href="#i-mark"/></svg></span><span class="tn-name">Open Agentic Brain and Memory</span></a>
  <nav class="tn-links" id="tn-links" aria-label="Main">{links}</nav>
  <a class="go sm tn-cta" href="{r}index.html#install">Install free {svg("i-go")}</a>
  <button type="button" class="menu" aria-controls="tn-links" aria-expanded="false" aria-label="Menu">{svg("i-menu")}</button>
</div></header>"""

def annc(r):
    return f"""<div class="annc" role="region" aria-label="Announcement">
  <span class="annc-long">Open Agentic Brain and Memory scores 94.2% on LongMemEval-S, reading 75% fewer tokens.</span><span class="annc-short">94.2% on LongMemEval-S, 75% fewer tokens.</span>
  <span class="annc-sep" aria-hidden="true">·</span>
  <a href="{r}index.html#numbers">Read results <svg aria-hidden="true"><use href="#i-go"/></svg></a>
</div>"""

def foot(r):
    col = lambda h, links: f'<div><p>{h}</p>' + "".join(f'<a href="{u}"{x}>{l}</a>' for u, l, x in links) + "</div>"
    ext = ' rel="noopener" target="_blank"'
    soc = [(u, l, ext) for k, l, u in SOCIAL if u] + [(REPO, "GitHub", ext)]
    return f"""<footer class="foot2">
  <div class="foot-top">
    <div class="foot-brand">
      <a class="brand" href="{r}index.html"><span class="logo"><svg class="mark"><use href="#i-mark"/></svg></span>Open Agentic Brain and Memory</a>
      <p>One private memory for every AI coding tool. Open source, self-hosted, encrypted with your key.</p>
      {socials()}
    </div>
    {col("Product", [(f"{r}index.html#install", "Install", ""), (f"{r}index.html#numbers", "Benchmarks", ""), (f"{r}index.html#video", "Launch video", ""), (REPO, "Source code", ext), (REPO + "/releases", "Releases", ext)])}
    {col("Connect", [(f"{r}connect-{t[0]}.html", t[1], "") for t in TOOLS] + [(f"{r}connect.html", "All tools", "")])}
    {col("Stories", [(f"{r}{n}.html", l, "") for n, l in PAGES if n != "index"])}
    {col("Resources", [(f"{r}blog/index.html", "Blog", ""), (f"{r}privacy.html", "Privacy", ""), (f"{r}contact.html", "Contact", ""), (f"mailto:{EMAIL}", "Email us", "")])}
    {col("Community", soc)}
  </div>
  <div class="foot-bot"><span>© 2026 {CREDIT.replace("Built by ", "Built by ")}. Apache-2.0.</span><span>No account, no server of ours.</span></div>
</footer>"""

def vmodal():
    return f"""<div class="vmodal" id="vmodal" role="dialog" aria-modal="true" aria-label="Launch video" hidden data-id="{VIDEO_ID}">
  <div class="vmodal-box"><button type="button" class="vmodal-x" aria-label="Close video">{svg("i-close")}</button><div class="vframe"></div></div>
</div>"""

def video_block(r):
    """Click-to-load launch video: nothing from YouTube loads until the visitor presses play."""
    return f"""<button type="button" class="vposter spot" data-video aria-label="Play the launch video: {VIDEO_TITLE}">
  <span class="vp-grid" aria-hidden="true"></span>
  <span class="vp-play">{svg("i-play")}</span>
  <span class="vp-cap"><b>{VIDEO_TITLE}</b><small>Launch video · YouTube</small></span>
</button>"""

def tools_flow(r):
    return '<div class="flow"><span class="me"><svg class="mark"><use href="#i-mark"/></svg>Your brain</span>' + svg("i-go", "arr") + "".join(
        f'<a href="{r}connect-{t[0]}.html">{tool_label(t)}</a>' for t in TOOLS[:5]) + "</div>"


def page(name, title, desc, body, scripts, r=""):
    home = "./" if artifact else "index.html"
    switch = "" if artifact or name not in dict(PAGES) or name == "index" else '<nav class="switch" aria-label="Stories">' + "".join(
        f'<a href="{n}.html"{CUR if n == name else ""}>{l}</a>' for n, l in PAGES) + "</nav>"
    url = SITE if name == "index" else f"{SITE}{name}.html"
    head = f"""<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Open Agentic Brain and Memory">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{SITE}img/og.png?v=2">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{SITE}img/og.png?v=2">
{HOME_LD if name == "index" else ""}
<meta name="theme-color" content="#000000">
{icon}
{fonts}
<link rel="stylesheet" href="{v('style.css')}">
<link rel="stylesheet" href="{v('story.css')}">
<link rel="stylesheet" href="{v('shell.css')}">
{f'<link rel="stylesheet" href="{v("home.css")}">' if name == "index" else ""}"""
    main = f"""{sprite}
<canvas id="brain" aria-hidden="true"></canvas>
<div class="vignette" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>
<div class="progress" aria-hidden="true"><span></span></div>
{side(name, r) if name == "index" else ""}
{annc(r)}
{topnav(name, r)}
<div class="page">
<main>
{body}
</main>
{switch}
{foot(r)}
</div>
{vmodal()}
<script src="{v('brain.js')}"></script>
{chr(10).join(f'<script src="{v(s)}"></script>' for s in scripts)}
<script src="{v('shell.js')}"></script>"""
    if artifact and name == ENTRY:
        html = head + "\n" + main
    else:
        html = f"""<!doctype html>
<html lang="en" class="{"has-side" if name == "index" else "no-side"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{head}
</head>
<body class="{"has-side" if name == "index" else "no-side"}">
{main}
</body>
</html>
"""
    if not artifact:
        html = with_gtm(html)
    (out / f"{name}.html").write_text(html)
    print("wrote", out / f"{name}.html")


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
    body = (body.replace("{{VIDEO}}", video_block("")).replace("{{FLOW}}", tools_flow(""))
                .replace("{{INSTALL_CMD}}", INSTALL_CMD).replace("{{REPO}}", REPO))
    page(name, title, desc, body, scripts)


# ── Connect pages: one per tool, plus an index of all of them
def matrix_row(t):
    ok = lambda s: not s.startswith(("Not ", "None"))
    cell = lambda s: f'<td class="{"y" if ok(s) else "n"}">{svg("i-check" if ok(s) else "i-x")}<span>{s}</span></td>'
    return f'<tr><th scope="row"><a href="connect-{t[0]}.html">{tool_label(t)}</a></th>{cell(t[4])}{cell(t[5])}{cell(t[6])}</tr>'

def install_block():
    return f"""<div class="install left">
  <div class="cmd"><code>{INSTALL_CMD}</code><button class="copy" type="button" aria-label="Copy the install command">Copy</button></div>
  <div class="works" aria-label="Requirements"><span>{svg("l-apple")}macOS or Linux</span><span>{svg("l-node")}Node 22+</span><span>git</span><span>{svg("l-github")}A GitHub account</span></div>
</div>"""

if not artifact:
    for t in TOOLS:
        slug, name, ico, beta, cap, push, pull, how, check = t
        others = "".join(f'<a href="connect-{o[0]}.html">{tool_label(o)}</a>' for o in TOOLS if o[0] != slug)
        pull_only = cap.startswith("Not")
        body = f"""<section class="doc-hero" data-b="0.8 0.5 0.55 0.6 1" data-toc="Overview" id="overview">
  <div class="doc-ico">{svg(ico) if ico else '<i class="noico">K</i>'}</div>
  <p class="eyebrow">Connect · {name}{" · beta" if beta else ""}</p>
  <h1>Give {name} a memory.</h1>
  <p class="sub">{"The model can search your brain whenever it decides to. Nothing to configure by hand." if pull_only else f"Everything you decide in {name} is remembered, and every other tool you use knows it next time. One command, nothing to configure by hand."}</p>
  <div class="cta"><a class="btn primary" href="#install">Install free {svg("i-go")}</a><a class="btn ghost" href="connect.html">All tools</a></div>
</section>
<section class="cdoc" data-b="0.82 0.55 0.5 0.22 0.5" id="support" data-toc="What you get">
  <p class="eyebrow">01 · What you get</p>
  <h2>“Supported” means three things. Here's each one for {name}.</h2>
  <div class="trio">
    <div class="spot {"n" if pull_only else "y"}"><b>Capture</b><small>Do its sessions flow back into the brain?</small><p>{cap}</p></div>
    <div class="spot {"n" if push.startswith("None") else "y"}"><b>Push</b><small>Is a briefing written into a file it loads on its own?</small><p>{push}</p></div>
    <div class="spot y"><b>Pull</b><small>Can the model search the brain when it needs to?</small><p>{pull}</p></div>
  </div>
</section>
<section class="cdoc" data-b="0.82 0.55 0.5 0.22 0.5" id="install" data-toc="Install">
  <p class="eyebrow">02 · Install</p>
  <h2>One command wires {name} and every other tool on your machine.</h2>
  <ol class="steps2">
    <li><b>Run the installer.</b> It creates your private data repo on GitHub, generates your key into the Keychain, and asks whether to start with your past AI sessions or fresh.{install_block()}</li>
    <li><b>It wires {name}.</b> {how}</li>
    <li><b>Check it.</b> {check} For a full read-only check of every tool, run <code>brain doctor</code>.</li>
  </ol>
</section>
<section class="cdoc" data-b="0.82 0.55 0.5 0.22 0.5" id="faq" data-toc="Questions">
  <p class="eyebrow">03 · Questions</p>
  <h2>Connecting {name}</h2>
  <div class="faq">
    <details><summary>Do I need an account or an API key?</summary><p>No. There's no account and no server of ours. The memory lives in a SQLite file on your machine, and travels as one <code>age</code>-encrypted file to a private GitHub repo you own.</p></details>
    <details><summary>Will it overwrite my instructions file?</summary><p>No. The briefing lives inside its own <code>BRAIN:START/END</code> markers, and MCP wiring is additive: it never touches entries it didn't create.</p></details>
    <details><summary>Does {name} see what I did in other tools?</summary><p>Yes. There's one store for every tool on the machine, and your other machines get it through <code>brain sync</code> and <code>brain restore</code>.</p></details>
    <details><summary>What platforms work?</summary><p>macOS and Linux, with Node 22+, git and a GitHub account. Windows isn't supported yet.</p></details>
  </div>
</section>
<section class="cdoc" data-b="0.82 0.55 0.5 0.22 0.5" data-toc="Other tools">
  <p class="eyebrow">04 · Other tools</p>
  <h2>Same brain, every tool.</h2>
  <div class="chips">{others}</div>
</section>"""
        page(f"connect-{slug}", f"Connect {name} to Open Agentic Brain and Memory",
             f"Give {name} long-term memory shared with your other AI coding tools: what gets captured, pushed and pulled, and how to install it.", body, ["story.js"])

    rows = "".join(matrix_row(t) for t in TOOLS)
    cards = "".join(f'<a class="tcard spot" href="connect-{t[0]}.html"><span class="tc-ico">{svg(t[2]) if t[2] else "<i class=noico>K</i>"}</span><b>{t[1]}{"<small class=beta>beta</small>" if t[3] else ""}</b><small>{"Pull only" if t[4].startswith("Not") else "Capture · Push · Pull"}</small>{svg("i-go", "arr")}</a>' for t in TOOLS)
    body = f"""<section class="doc-hero" data-b="0.8 0.5 0.55 0.6 1" id="overview" data-toc="Overview">
  <p class="eyebrow">Connect</p>
  <h1>Every tool plugs into one brain.</h1>
  <p class="sub">One installer wires every AI tool it finds on your machine. Pick a tool to see exactly what it gets.</p>
</section>
<section class="cdoc" data-b="0.82 0.55 0.5 0.22 0.5" id="tools" data-toc="Tools"><div class="tcards">{cards}</div></section>
<section class="cdoc" data-b="0.82 0.55 0.5 0.22 0.5" id="matrix" data-toc="What “supported” means">
  <p class="eyebrow">Capture · Push · Pull</p>
  <h2>Three different things, kept apart.</h2>
  <p class="sub"><b>Capture:</b> sessions flow back in. <b>Push:</b> a briefing the tool loads on its own, always present. <b>Pull:</b> the model can search memory when it decides to.</p>
  <div class="matrix2-wrap"><table class="matrix2"><thead><tr><th>Tool</th><th>Capture</th><th>Push</th><th>Pull</th></tr></thead><tbody>{rows}</tbody></table></div>
</section>
<section class="cdoc" data-b="0.82 0.55 0.5 0.22 0.5" id="install" data-toc="Install">
  <p class="eyebrow">Install</p>
  <h2>One command for all of them.</h2>
  {install_block()}
</section>"""
    page("connect", "Connect your AI coding tools to Open Agentic Brain and Memory",
         "Claude Code, Codex, Cursor, Antigravity CLI, Kilo Code, Claude Desktop and ChatGPT desktop: what each one gets from one shared memory.", body, ["story.js"])

# ── Preview redesign: _src/v2.html -> v2.html (standalone page, shared sprite/fonts/icons)
if not artifact and (root / "_src" / "v2.html").exists():
    v2 = (root / "_src" / "v2.html").read_text().replace("{{HEAD}}", icon + "\n" + fonts).replace("{{SPRITE}}", sprite)
    (root / "v2.html").write_text(with_gtm(v2))
    print("wrote", root / "v2.html")

# ── Blog: _src/blog/*.html -> blog/ (one level down, so shared assets get ../)
if not artifact:
    blog_head = "\n".join([
        icon.replace('href="img/', 'href="../img/'),
        fonts,
        '<link rel="stylesheet" href="blog.css">',
        f'<link rel="stylesheet" href="../{v("shell.css")}">',
    ])
    (root / "blog").mkdir(exist_ok=True)
    for f in sorted((root / "_src" / "blog").glob("*.html")):
        html = f.read_text().replace("{{HEAD}}", blog_head).replace("{{SPRITE}}", sprite)
        # the site footer (columns + social links) replaces each post's own footer
        html = re.sub(r'<footer class="blog-foot">.*?</footer>', lambda m: foot("../"), html, flags=re.S)
        html = re.sub(r"<header class=\"site\">.*?</header>", lambda m: annc("../") + "\n" + topnav("blog", "../"), html, flags=re.S)
        html = html.replace("<body>", "<body class=\"no-side blogpage\">", 1)
        html = html.replace("</body>", vmodal() + f'\n<script src="../{v("shell.js")}"></script>\n</body>', 1)
        html = with_gtm(html, "../")
        (root / "blog" / f.name).write_text(html)
        print("wrote", root / "blog" / f.name)
    # old /blog.html links keep working
    (root / "blog.html").write_text('<!doctype html><meta charset="utf-8"><title>Open Agentic Brain and Memory Blog</title>'
        '<link rel="canonical" href="https://rohithhn.github.io/brain-site/blog/">'
        '<meta http-equiv="refresh" content="0; url=blog/index.html"><a href="blog/index.html">Blog</a>')
