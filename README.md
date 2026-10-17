# Paul Thornton · App Catalogue

A single-page static catalogue of every app published by **Paul Thornton** on the Apple App Store
([developer page](https://apps.apple.com/us/developer/paul-thornton/id1203471660)).

**Live site:** https://proteus-mx.github.io/app-catalog/

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | The catalogue page: a card for each app with icon, name, genre, short description, price and App Store link |
| `style.css` | Responsive styles with automatic light/dark mode (`prefers-color-scheme`) |
| `app.js` | Small script for search and genre filtering |
| `apps.json` | Raw app data (name, URL, icon, genre, price, platforms, version, dates, ratings, bundle ID) |

## Data source

App data comes from Apple's public iTunes Lookup API (US storefront):

```
https://itunes.apple.com/lookup?id=1203471660&entity=software&limit=200
```

Icons load from Apple's CDN (`mzstatic.com`) using the artwork URLs from that API.

## Run locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

No build step and no dependencies.
