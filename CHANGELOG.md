# Changelog

All notable changes to Self Employed Budget. Newest first.
Format follows [Keep a Changelog](https://keepachangelog.com); versions follow
[Semantic Versioning](https://semver.org).

---

## [0.1.4] — 2026-08-07

Layout fixes for phones. First build tested on a real device.

### Fixed
- **Blank band below the bottom bar on iPhone.** The nav bar was adding the home
  indicator safe area twice — once to its height and again to its bottom padding —
  leaving roughly 48px of empty space under the icons. It now reserves that space once.
- **Dead scroll space at the end of every screen.** The content area still carried
  96px of bottom padding from the prototype, where the nav floated over the content.
  The nav is now a normal sibling, so that padding is gone.
- **Gap when iOS Safari hides its toolbar.** The app now uses `100dvh` where supported,
  which follows the browser chrome as it appears and disappears, with `100%` as a fallback.
- Background colour applied to `html` as well as `body`, so an overscroll bounce never
  shows a white strip.
- Toast repositioned to sit just above the shorter nav bar.

---

## [0.1.3] — 2026-08-07

Renamed to **Self Employed Budget**. No functional changes.

### Changed
- App name, page title, manifest name, install text
- Home screen label set to **SE Budget** — phones truncate anything past about
  12 characters, so the full name would have shown as "Self Employ..."
- Service worker cache renamed to `self-employed-budget-v0.1.3`
- Repository and folder renamed to `self-employed-budget`

---

## [0.1.2] — 2026-08-07

Renamed the project from Meter to **Home Budget**. No functional changes.

### Changed
- App name, page title, manifest name and short name, install text
- Service worker cache renamed to `home-budget-v0.1.2` so the rename reaches
  anyone who already installed the old build
- Repository and folder renamed to `home-budget`

---

## [0.1.1] — 2026-08-07

Switched hosting from shared cPanel hosting to GitHub + Vercel. No changes to how the
app looks or behaves.

### Added
- `vercel.json` — caching rules so `sw.js`, `index.html` and the manifest are never
  cached by the CDN, while icons are cached for a year. Without this, users would keep
  seeing old versions after a deploy.
- Basic security headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`
- `.gitignore` — keeps `.env`, `.vercel` and editor junk out of the repo

### Changed
- Manifest `start_url` from `./index.html` to `./`, and the same for app shortcuts,
  so they survive Vercel's URL handling
- README deployment section rewritten for the GitHub → Vercel workflow, including
  domain connection and preview deploys

---

## [0.1.0] — 2026-08-07

First working build. The app runs, looks finished, and installs to a phone home screen.
Data is held in memory only, so entries are lost when the app closes — that is fixed in v0.2.

### Added
- **App shell** — full-screen responsive layout, night and day themes, theme toggle
- **Home screen** — target gauge with Day / Week / Month tabs, jobs count, average per job,
  amount still to go
- **Target cards** — week to date (Monday to Sunday) and month to date (1st onward), each with
  a progress bar, a pace marker, and an ahead-or-behind figure
- **Week bar chart** — seven days against the daily target line
- **Add entry** — Income / Business cost / Home cost, with:
  - income sources: Fare, Free Now, Uber, Others
  - business categories: fuel, insurance, repairs, car wash, licence, phone, parking, tolls
  - home categories: groceries, rent, utilities, kids, eating out, transport, health
  - payment method: cash, card in car, app payout, bank transfer, invoice unpaid
  - repeat chips built from recent entries, quick amount bumps (+5 / +10 / +20 / +50)
- **Reports** — Day / Week / Month / Year, showing income → business costs → net income →
  home costs → take-home, plus breakdowns by source and category
- **Editable targets** — daily, weekly and monthly
- **PWA** — web manifest, app icons, service worker, add-to-home-screen button,
  works offline after first load
- **Real dates** — weeks run Monday to Sunday, months from the 1st, calculated from the
  device clock rather than fixed sample data

### Known limitations
- Entries reset when the app is closed
- The Entries tab, past-period browsing, and exports show a placeholder message
- No accounts yet — the app is single-user and local to the browser
- Currency fixed to euro

---

## Version numbering

- **0.x.y** — pre-launch. Things can still change shape.
- **1.0.0** — first public release on a real domain.
- After 1.0: patch (1.0.**1**) for fixes, minor (1.**1**.0) for new features,
  major (**2**.0.0) for anything that breaks existing data.
