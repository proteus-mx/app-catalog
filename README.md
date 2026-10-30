# Sapphire Studios · App Catalogue

A static showcase of every Sapphire Studios app on the Apple App Store.

**Live site:** https://proteus-mx.github.io/app-catalog/

## What's here

| Path | Purpose |
| --- | --- |
| `index.html` | The catalogue: hero, a carousel of featured collections, recently updated apps, and a searchable, filterable grid of every app |
| `about.html` | About: the studio's story and mission, numbers (same count-up as the catalogue), what we make, featured collections, what's coming next and our approach |
| `team.html` | Team: Paul Thornton (Founder & Chief Technology Officer) and Sophie Thornton (Junior Brand, Digital Marketing & AI Coordinator), plus the AI team (Engineering, Marketing, Design and QA Lead agents; `AI_TEAM` in the generator) |
| `support.html` | Support: contact email, per-app email links with the subject prefilled, troubleshooting tips and FAQ |
| `privacy.html` | Privacy Policy (ads via Google AdMob, purchases via Apple, children's privacy, Australian Privacy Act) |
| `support/`, `privacy/` | Clean URLs for App Store Connect (`…/app-catalog/support/`, `…/app-catalog/privacy/`) that redirect to the pages above |
| `labs.html` | Sapphire Labs: the idea funnel (Ideation → Proof of concept → Prototype, with HITL keep-or-kill gates) that feeds the Workflow, the Lab's principles and four-facet scoring lens, the filterable experiments board (from `labs.json`), graduates and Melt It up next |
| `labs.json` | Data for the Labs experiments board and stage counters (see *Labs board* below) |
| `workflow.html` | Workflow: how ideas become apps (Discover, Design, Develop, Deliver), with the AI agent leading each stage, the Human-in-the-Loop (HITL) checkpoints, the feedback loop and a "Who does what?" stage slider (`STAGES` in the generator) |
| `assets/team/` | Team photos (`<slug>.jpg` plus `<slug>.webp`; 800×800, sRGB, metadata stripped). Paul and Sophie both have photos; a member without one gets a monogram tile |
| `style.css` | Sapphire design system: deliberate dark theme, glass surfaces, responsive layout, reduced-motion support |
| `app.js` | Search and category filter (press `/` to jump to search), the collections carousel, floating icons (tap to jump to an app, or drag and fling them) and the hero stats count-up |
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

## Team flip cards

On the Team page, Paul's and Sophie's panels are 3D flip cards: the front is the profile, the back is a Sapphire Studios business card (name and title, gem wordmark, tagline, four real App Store categories and a QR code to the catalogue, `assets/qr-app-catalog.svg`). Drag or swipe sideways to turn them, or tap/click, or press Enter/Space. Vertical page scrolling still works over them, and with reduced motion they cross-fade instead of rotating.

## Navigation

Every page shares one header and footer from the generator. At 860px and below the header shows the logo plus a menu button that opens a panel (Apps, Labs, Workflow, About, Team, View on App Store); it closes on a link tap, an outside tap, Esc or scrolling. Between 860px and 1000px the in-page Collections and Latest links are hidden so nothing collides. Without JavaScript, phones show the page links as a scrollable second header row. The footer also links Support and Privacy.

## Browser notes

- `index.html` loads `style.css?v=…` and `app.js?v=…`. GitHub Pages caches files for 10 minutes, so **change the `v` value whenever you edit either file**. Without that, browsers (Safari especially) can pair new HTML with an old cached stylesheet and script.
- Tested in Safari/WebKit (desktop and iPhone), Chrome and Chromium. The site works back to Safari 15: newer CSS such as `color-mix()` has plain colour fallbacks, `inert` has a tab-order fallback, and `backdrop-filter` is kept to a few large surfaces for performance.

## Workflow page

Stage owners follow the Team page's AI agents and reporting lines: Marketing and Design Leads (Sophie) lead Discover and Design, the Engineering Lead (Paul) leads Develop, and the QA and Marketing Leads lead Deliver. The journey gem follows the wavy path on desktop and a vertical rail on phones as you scroll; with reduced motion everything is shown complete and static. Keep the copy factual: no invented metrics, percentages or timelines.

## Labs board

The Labs page reads `labs.json`. **This file is public** (it's in a public repo), so only put a real title on ideas that are already public; leave everything else as a classified placeholder.

```json
{
  "in_play": "100–200",
  "stages": [{"id": "ideation", "name": "Ideation", "blurb": "…"}, {"id": "poc", "name": "Proof of concept", "blurb": "…"}, {"id": "prototype", "name": "Prototype", "blurb": "…"}],
  "themes": ["Arcade", "Puzzles", "Words", "Learning", "Relaxing toys", "Utilities"],
  "experiments": [
    {"title": "Melt It", "stage": "prototype", "theme": "Relaxing toys", "public": true, "status": "Up next", "note": "One-line description shown on the tile"},
    {"title": null, "stage": "ideation", "theme": "Puzzles", "public": false}
  ]
}
```

To add an idea, append an item to `experiments` with a `stage` (`ideation`, `poc` or `prototype`) and a `theme` (one of `themes`; add new themes there). Set `"public": true` with a `title` and `note` to show it openly; otherwise it renders as a "Top secret" tile with a codename (LAB-001…). The stage counters and filters update automatically. `in_play` is the headline figure. Rebuild with `build_catalog.py` afterwards.

## Support & Privacy

The contact address is `SUPPORT_EMAIL` in the generator. It appears only on `support.html` and `privacy.html`, HTML-entity-encoded (a light guard against scrapers that still works without JavaScript). Each app on the Support page has its own `mailto:` link with the subject "Sapphire Studios support: <App>" and a short body template. Update `POLICY_DATE` whenever the privacy policy text changes. Use `https://proteus-mx.github.io/app-catalog/support/` and `https://proteus-mx.github.io/app-catalog/privacy/` in App Store Connect.

## Business details

The ABN (66 481 618 329) is set once as `ABN` in the generator and appears in every page footer and in the About page's Business details.

## Manual figures

Download numbers (the hero "Downloads" stat and the per-app download badges) don't come from Apple. They're set by hand in the site generator (`MANUAL_STATS` and `DOWNLOADS`), so the daily App Store sync keeps them.

## Generator

`index.html`, `labs.html`, `workflow.html`, `about.html`, `team.html`, `support.html` and `privacy.html` (plus the `support/` and `privacy/` redirects) are all written by the site generator (`build_catalog.py`, run by the daily App Store sync), from shared nav and footer templates, so the Labs, Workflow, About, Team, Support and Privacy links and pages survive rebuilds. Team details live in its `TEAM` list; to swap a monogram for a photo, add `assets/team/<slug>.jpg` and rebuild.
