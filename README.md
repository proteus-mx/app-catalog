# Sapphire Studios · App Catalogue

A single-page static showcase of every Sapphire Studios app on the Apple App Store.

**Live site:** https://proteus-mx.github.io/app-catalog/

## What's here

| Path | Purpose |
| --- | --- |
| `index.html` | The catalogue: hero, recently updated apps, and a searchable, filterable grid of every app |
| `style.css` | Sapphire design system: deliberate dark theme, glass surfaces, responsive layout, reduced-motion support |
| `app.js` | Search and category filter (press `/` to jump to search) |
| `apps.json` | App data: name, App Store URL, icon, category, price, platforms, version and release dates |
| `assets/icons/` | App icons (256×256 JPEG) |

## Data source

App details come from Apple's public iTunes Lookup API (US storefront). Every card links to the app's App Store page.

## Run locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

No build step and no dependencies. The Inter font loads from Google Fonts and falls back to the system font.
