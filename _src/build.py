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
CREDIT = "Built by Rohith, Chandhan and Sushmita"
ENTRY = "index"  # in an artifact this page is the root page; the rest are files beside it


def index_section(n):
    """Section n of index.html: from its `<!-- n · ` comment to the next section comment."""
    m = re.search(rf"<!-- {n} · .*?-->\n(.*?)(?=\n<!-- \d+ · |\n</main>)", index, re.S)
    return m.group(1)

artifact = "--artifact" in sys.argv
out = pathlib.Path(sys.argv[sys.argv.index("--artifact") + 1]) if artifact else root

pages = PAGES + TABS
if artifact:
    pages = [p for p in pages if p[0] == ENTRY] + TABS
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
    tabs = "".join(f'<a href="{n}.html"{CUR if n == name else ""}>{l}</a>' for n, l in TABS)
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
  <nav>{tabs}<span class="soon-pill"><i></i>Coming soon</span></nav>
</header>
<main>
{body}
</main>
{switch}
<footer class="foot">
  <span class="brand small"><svg class="mark"><use href="#i-mark"/></svg>Agentic Brain</span>
  <span>{CREDIT}</span>
  <span>Open source, self-hosted memory for AI coding tools. Coming soon.</span>
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
    (out / f"{name}.html").write_text(html)
    print("wrote", out / f"{name}.html")
