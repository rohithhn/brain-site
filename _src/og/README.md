Source for `img/og.png`, the 1200x630 link-preview card used by og:image / twitter:image.

Render (macOS, Chrome):

    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
      --window-size=1200,630 --screenshot=img/og.png file://$PWD/_src/og/og.html

Edit the text in og.html, re-render, commit both.
