# Sapphire Studios · App Catalogue

A single-page static showcase of every Sapphire Studios app on the Apple App Store.

**Live site:** https://proteus-mx.github.io/app-catalog/

## What's here

| Path | Purpose |
| --- | --- |
| `index.html` | The catalogue: hero, a carousel of featured collections, recently updated apps, and a searchable, filterable grid of every app |
| `style.css` | Sapphire design system: deliberate dark theme, glass surfaces, responsive layout, reduced-motion support |
| `app.js` | Search and category filter (press `/` to jump to search), plus the collections carousel |
| `apps.json` | App data: name, App Store URL, icon, category, price, platforms, version and release dates. Upcoming titles live under `comingSoon` and collections under `collections` |
| `assets/glow/` | Pre-blurred icon glows used behind featured cards (avoids costly CSS blur filters in Safari) |
| `assets/icons/` | App icons (256×256 JPEG; `melt-it.jpg` is 512×512) |

## Data source

App details come from Apple's public iTunes Lookup API (US storefront). Every card links to the app's App Store page.

## Run locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

No build step and no dependencies. The Inter font loads from Google Fonts and falls back to the system font.

## Featured collections

The carousel near the top rotates through curated collections defined in `apps.json` under `collections`:

| Collection | Apps |
| --- | --- |
| The "It" Collection | Sculpt It, Squish It, Melt It (coming soon) |
| Word Lovers | Word Bloom +, WordAIly Learn, Wordaily Watch, Say What |
| Brain Teasers | Shuffle Puzzle +, Block Race, Block Challenge, Memory Magic, SaiMON |
| Grid Rivals | Grid Wars, Dot Connect, tAc-tIc-toe, tronAIx, Sphere Tronic |
| Arcade Action | Pocket Pong +, BlastarX, Pencil Battle, BotWars, Global Shield |
| Learn Something | Fallacy Quest, Operation Order, DNA Simulator, Databricks Quiz |

The carousel rotates every 6.5 seconds. It pauses on hover, on keyboard focus and while the tab is hidden, and stays still when the system asks for reduced motion. You can also move through it with the arrow buttons, the collection buttons, the left and right arrow keys, or a swipe on touch screens, and there's a pause/play button.

## Browser notes

- `index.html` loads `style.css?v=…` and `app.js?v=…`. GitHub Pages caches files for 10 minutes, so **change the `v` value whenever you edit either file**. Without that, browsers (Safari especially) can pair new HTML with an old cached stylesheet and script.
- Tested in Safari/WebKit (desktop and iPhone), Chrome and Chromium. The site works back to Safari 15: newer CSS such as `color-mix()` has plain colour fallbacks, `inert` has a tab-order fallback, and `backdrop-filter` is kept to a few large surfaces for performance.
