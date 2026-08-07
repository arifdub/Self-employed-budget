# Changelog

All notable changes to Self Employed Budget. Newest first.
Format follows [Keep a Changelog](https://keepachangelog.com); versions follow
[Semantic Versioning](https://semver.org).

---

## [0.1.8] — 2026-08-08

Different approach to the bottom band, after v0.1.7 did not fix it on device.

### Changed
- **The bottom bar is now pinned to the viewport, not to the end of a flex column.**
  It uses `position:fixed; bottom:0`, which is the physical bottom of the screen.
  Previously it was the last item in a flex column, so its position depended on the
  container resolving its height correctly — which is exactly what iOS was getting
  wrong. There is now no height for anything to get wrong.
- Sheets, the targets modal and the toast switched from `absolute` to `fixed` for
  the same reason, each capped at the 520px app width.
- Content padding increased to clear the pinned bar.

### Added
- **CSS version stamp.** `app.css` now declares `--css-version`, which the header
  reads and displays. If the stylesheet is stale, the header shows something like
  `v0.1.8 css0.1.7` instead of just `v0.1.8`. This makes a cached stylesheet
  visible rather than something to guess at — the previous three attempts could not
  distinguish "the fix is wrong" from "the fix never arrived".
- `Cache-Control: must-revalidate` on `app.css` and `app.js` in `vercel.json`.
  Only `sw.js`, `index.html` and the manifest had it, so the CDN was free to serve
  a stale stylesheet alongside a fresh script.

---

## [0.1.7] — 2026-08-07

The actual fix for the band under the bottom bar. Confirmed on device at v0.1.6,
so this is the third and correct attempt.

### Fixed
- **Removed every height declaration from the app container.** A `position:fixed`
  element with `top:0` and `bottom:0` already stretches to the full viewport in
  every browser. Each height I tried instead — `100%`, `100dvh`, and finally a
  JavaScript measurement — resolves against a viewport that excludes the bottom
  safe area on iOS, so all three made the app shorter than the screen. The gap was
  the difference.
- Deleted the `visualViewport` measurement added in v0.1.6. `visualViewport.height`
  under-reports in standalone mode, which is what produced the remaining band.

### Lesson for later
If a fixed full-screen element ever needs a height, it does not. Anchor it with
`top` and `bottom` and let the browser do the arithmetic.

---

## [0.1.6] — 2026-08-07

The real cause of the band under the bottom bar on iPhone.

### Fixed
- **App container height.** It was set with `height:100%` on a `position:fixed`
  element. On iOS that percentage resolves against the *small* viewport — the one
  measured as if the browser toolbars were showing — so the app was always shorter
  than the screen, and the difference showed as dead space at the bottom. The height
  declaration is gone; the element now stretches between `top:0` and `bottom:0`,
  which is correct in every browser. The earlier `100dvh` rule was overriding that
  stretch and made it worse rather than better.
- **Belt and braces:** the real viewport height is now measured in JavaScript and
  written to a `--vh` custom property, updated on resize, orientation change and
  when the app returns to the foreground. If a browser ever mis-reports its insets,
  the measured value wins.

---

## [0.1.5] — 2026-08-07

Two fixes that make every future update easier to verify.

### Fixed
- **Remaining gap under the bottom bar.** The nav had a fixed height that had to be
  guessed against the home indicator. It now sizes to its own content plus
  `max(safe-area, 8px)`, so it fits any device without arithmetic.

### Added
- **Automatic updates.** The app now registers its service worker with
  `updateViaCache: 'none'`, checks for a new version every time it is brought back
  to the foreground, and reloads itself once the new version is ready. Deploying a
  change is now enough — no deleting the home screen icon, no clearing Safari.
- **Version number in the header**, next to the date. If the app shows `v0.1.5`,
  you are on the current build. This makes "is it cached?" a one-second check
  instead of a guess.

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
