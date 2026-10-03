# brain-site

Landing page for Agentic Brain, served by GitHub Pages.

Plain static files, no build step and no libraries:

- `index.html` – the page, with an inline SVG sprite of tool logos and line icons
- `style.css` – styles; scroll progress arrives as CSS custom properties
- `brain.js` – the background brain: neurons on a canvas, wired to their neighbours, firing toward the cursor
- `app.js` – scroll choreography (pinned scenes, headline decode, tool wiring, vault pipeline, horizontal rail)

Tool logos come from `@lobehub/icons-static-svg` and `simple-icons` (both MIT).

Preview locally with `python3 -m http.server` and open http://localhost:8000.
