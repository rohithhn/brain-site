"""Assemble the story pages from _src/*.body.html with the shared head, sprite, nav and scripts.
Run from the repo root: python3 _src/build.py [--artifact OUTDIR]"""
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
index = (root / "index.html").read_text()
sprite = re.search(r'<svg width="0" height="0".*?</svg>', index, re.S).group(0)
fonts = '\n'.join(l for l in index.splitlines() if 'fonts.g' in l)
icon = re.search(r'<link rel="icon"[^>]*>', index).group(0)
CUR = ' aria-current="page"'
PAGES = [("week", "A week"), ("voice", "I remember"), ("journey", "One memory")]
artifact = "--artifact" in sys.argv
out = pathlib.Path(sys.argv[sys.argv.index("--artifact") + 1]) if artifact else root

for name, label in PAGES:
    body = (root / "_src" / f"{name}.body.html").read_text()
    title = re.search(r"<!--TITLE:(.*?)-->", body).group(1)
    desc = re.search(r"<!--DESC:(.*?)-->", body).group(1)
    switch = "" if artifact else '<nav class="switch" aria-label="Stories"><a href="index.html">Overview</a>' + "".join(
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
  <a class="brand" href="{'#' if artifact else 'index.html'}"><svg class="mark"><use href="#i-mark"/></svg>Agentic Brain</a>
  <nav><span class="soon-pill"><i></i>Coming soon</span></nav>
</header>
<main>
{body}
</main>
{switch}
<footer class="foot">
  <span class="brand small"><svg class="mark"><use href="#i-mark"/></svg>Agentic Brain</span>
  <span>Open source, self-hosted memory for AI coding tools. Coming soon.</span>
</footer>
<script src="brain.js"></script>
<script src="story.js"></script>"""
    if artifact:
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
