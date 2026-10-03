# brain-site

Landing page for [Agentic Brain](https://github.com/rohithhn/ultra-agentic-memory-public), served by GitHub Pages.

Plain static files, no build step and no libraries:

- `index.html` – the page
- `style.css` – styles; scroll progress arrives as CSS custom properties
- `brain.js` – the background brain: neurons on a canvas, wired to their neighbours, firing toward the cursor
- `app.js` – scroll choreography (pinned scenes, the tool wiring, the vault pipeline, the horizontal rail)

Preview locally with `python3 -m http.server` and open http://localhost:8000.
