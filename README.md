# brain-site

Landing page for Agentic Brain, served by GitHub Pages.

Plain static files, no build step and no libraries:

- `index.html` – the main page (built from `_src/index.body.html`): the brain tells its story, chapter by chapter
- `overview.html` – the original overview page; its sections are reused by the main page
- `week.html`, `voice.html`, `journey.html` – alternative story pages
- `blog.html`, `privacy.html`, `contact.html` – header pages
- `_src/` – page sources; run `python3 _src/build.py` after editing them
- `style.css` – styles; scroll progress arrives as CSS custom properties
- `brain.js` – the background brain: neurons on a canvas, wired to their neighbours, firing toward the cursor
- `app.js` – scroll choreography (pinned scenes, headline decode, tool wiring, vault pipeline, horizontal rail)

Tool logos come from `@lobehub/icons-static-svg` and `simple-icons` (both MIT).

Preview locally with `python3 -m http.server` and open http://localhost:8000.
