# Changelog

All notable changes to Self Employed Budget. Newest first.
Format follows [Keep a Changelog](https://keepachangelog.com); versions follow
[Semantic Versioning](https://semver.org).

---

## [0.5.3] — 2026-08-09

### Fixed
- **The crash guard was reporting failed resource loads as app errors.** A missing
  icon or a blocked font request fires an error event just like a script crash, so
  the red bar appeared even though the app was working normally. The guard now
  ignores resource failures (logging them to the console instead) and skips the
  bare "Script error." that browsers emit for cross-origin files with no detail.
- The bar is dismissible by tapping it, and now reports the column number as well
  as the line.

---

## [0.5.2] — 2026-08-09

### Changed
- **New app icon** — the SE Budget logo replaces the generated gauge placeholder.
  Regenerated at every required size:
  - `icon-192` / `icon-512` — rounded, transparent corners
  - `icon-maskable-512` — logo held inside the 80% safe zone on a seamless plate,
    so Android's circular and squircle crops never clip it and no rounded edge
    shows through
  - `apple-touch-icon-180` — full-bleed square, since iOS applies its own mask and
    would otherwise round already-rounded corners twice
  - `favicon-32`
- The service worker cache name changed, so installed apps pick up the new icon
  on their next update.

### Note
The tiny "SELF-EMPLOYED BUDGET" strapline in the logo is not legible below about
180px. It reads fine on the home screen; it becomes texture in the browser tab.
Worth a version of the logo without it if a cleaner small icon is ever wanted.

---

## [0.5.1] — 2026-08-09

### Changed
- **Background lifted to `#121A2F`** — a lighter, bluer navy than v0.5.0's `#111728`.
  The reference app's exact value read as dull once amber sat on it rather than green,
  so the whole ramp moved up: surfaces `#1A2340`, raised surfaces `#232E50`,
  borders `#2A3559`.
- **Muted text brightened** from `#8B97B4` to `#9AA6C4`, and secondary text from
  `#5C6884` to `#6E7A9C`. Labels and dates were receding into the background;
  they now hold their own against the lighter panels.
- **Green removed.** Positive figures — income rows, the take-home total, a hit
  target — now use a lighter amber `#FFC24D` rather than green, so the app runs on
  one warm accent plus coral for costs. Two colours, no third hue competing.

---

## [0.5.0] — 2026-08-09

Visual overhaul. Colours sampled directly from the PassDrivingTest.ie reference.

### Changed
- **Background is now `#111728`** — a deep navy, noticeably bluer than the previous
  near-black `#0B1018`. Surfaces, borders and muted text rebuilt around it.
  Amber stays as the accent; it reads considerably stronger on navy.
- **All type is now Plus Jakarta Sans.** Barlow Condensed was a narrow face, which
  is why labels looked thin and cramped — the wide letter-spacing everywhere was
  compensating for it. The new face is wider and much heavier, so tracking was
  pulled back in and weights raised across the board: headings 800, labels 700,
  body 500. Both themes share one family now instead of two.
- Figures use tabular numerals, so amounts line up in columns instead of drifting.
- Positive figures use `#54B685`, the green from the reference. Manifest and
  browser theme colour updated to match the new background.

---

## [0.4.2] — 2026-08-08

### Changed
- Entry type tabs relabelled: **Add income**, **Business expense**, **Home expense**.
  On screens under 390px the word shortens to **exp** so all three fit on one line
  without wrapping.
- The selected tab is now highlighted amber, matching the source tiles and payment
  pills below it. It previously used a muted grey fill, so the three selectable rows
  on the same screen indicated selection three different ways.

---

## [0.4.1] — 2026-08-08

### Fixed
- **v0.4.0 was broken on load — nothing responded to taps.** The draft entry's
  default date called `startOfDay()` inside the state object on line 32, but that
  helper is declared on line 87. A `const` cannot be read before its own definition
  executes, so the script threw immediately and no event handlers were ever attached.
  The date is now built inline where the state is defined.

### Added
- **Crash guard.** Any uncaught script error now paints a red bar at the top of the
  screen with the message and line number. A frozen app with no explanation cost a
  round trip to diagnose; this makes the next one obvious at a glance.

---

## [0.4.0] — 2026-08-08

### Added
- **Backdating.** The add screen opens with a date row: Today, Yesterday, and a
  calendar picker for anything older. Entries land in the right day, week and month,
  so a forgotten fare logged the next morning still counts where it belongs. Future
  dates are blocked. The save confirmation names the day when an entry is backdated.

### Changed
- **Removed the explanatory labels** from the add screen — "Counts towards today…",
  "Where did it come from?", "How was it paid?" and the "Your repeats will appear
  here" placeholder. The controls are self-evident and the text was crowding a screen
  used one-handed at speed. (For the record: these were static interface strings, not
  stored data — they used no database space.)
- Spacing between the rows increased to compensate, so the sections stay visually
  separated now that the headings are gone. The repeats row hides entirely when there
  is nothing to repeat, rather than showing a placeholder.

---

## [0.3.3] — 2026-08-08

### Changed
- **Tapping an entry no longer opens the edit sheet on touch devices.** Entries get
  touched accidentally constantly in real use; the sheet kept popping up. On a
  phone, the only way in is now: swipe left → tap Edit or Delete. Desktop mouse
  click still opens edit, since there is no swipe with a mouse and no accidental
  taps either.
- Swiping and choosing **Delete** now opens the sheet with the Delete button
  highlighted red and focused — one clear tap to confirm, rather than hunting for
  it inside the edit form.

---

## [0.3.2] — 2026-08-08

### Added
- **Swipe left on any entry** — on the home Today list or the Entries screen — to
  reveal Edit and Delete. Tapping a row still opens the edit sheet directly.
  Both lists share one row component now, so they cannot drift apart.
- Delete from the swipe action routes through the edit sheet rather than deleting
  in place, so a stray swipe cannot destroy an entry without one confirming tap.

### Fixed
- Editing an entry from the home list no longer re-renders the Entries screen
  unnecessarily when it is closed.

---

## [0.3.1] — 2026-08-08

### Added
- **Reset all data**, under More → Danger zone. Shows how many entries exist,
  then requires typing DELETE before the button arms. Removes every entry
  permanently; targets and theme are kept. Deliberately two steps — a single-tap
  destroyer next to ordinary settings is how people lose a month of records.

---

## [0.3.0] — 2026-08-08

Entries now survive closing the app. This is the release that makes the app usable
for real day-to-day tracking.

### Added
- **Persistence.** Every entry is saved to the device the moment it is added,
  edited or deleted, and loaded back when the app opens. Works offline; nothing
  leaves the phone. (Cloud sync across devices is v0.5.)
- **Entries screen** — the full history, grouped by day with a net figure per day,
  filterable by All / Income / Business / Home.
- **Edit and delete.** Tap any entry to change its amount or remove it. All
  totals, targets and reports update immediately.
- Targets and the chosen theme are also remembered between sessions.

### Changed
- The More screen no longer warns that data resets on close.

### Notes
- Data lives in the browser's storage for this site. Deleting the site's website
  data in iOS Settings, or clearing browsing data on Android, deletes the entries
  with it — worth knowing before cloud backup exists.

---

## [0.2.3] — 2026-08-08

The "gap" under the bottom bar turned out to be the bar's own padding.

### Context
After v0.2.2 the layout genuinely reaches the bottom of the screen — what remained
was the nav reserving the full 34px home-indicator inset *plus* its own spacing,
which reads as empty space beneath the icons. Native iOS tab bars tuck their labels
much closer to the indicator. The add sheet had the same double-count on the Save
button, which is what pushed the keypad's bottom row off screen.

### Changed
- Nav bottom padding: `max(safe-area − 16px, 6px)` instead of the full inset —
  labels now sit close above the home indicator, like a native tab bar
- Save button bottom margin: `max(safe-area − 6px, 10px)` instead of
  `20px + safe-area`
- Add sheet compacted (amount display, keypad, tiles, section labels) so the whole
  entry form fits a Pro Max screen without scrolling

---

## [0.2.2] — 2026-08-08

The last strip under the bottom bar in standalone mode.

### Fixed
- The app now fills `100lvh` — the **large** viewport — where supported. `100dvh`
  is the dynamic viewport, which on iOS tracks the *small* viewport in standalone
  mode, leaving a thin band below the nav equal to the difference. The fallback
  chain is `100vh` → `100dvh` → `100lvh`, so older browsers keep working.

---

## [0.2.1] — 2026-08-08

Empty bands at **both** the top and the bottom in standalone mode, each roughly the
height of the Safari chrome that is no longer there. That symmetry is the clue that
made this diagnosable: the app was being letterboxed, not merely mis-sized.

### Changed
- **The app is a normal in-flow document now.** `position: fixed` on the shell was
  the root cause. In iOS standalone a fixed element is sized against the
  browser-with-chrome viewport and centred in the screen, which produces a band above
  and below. Ordinary flow has no container to mis-measure — the page fills the
  screen and grows when it needs to. Every height fix since v0.1.4 was treating a
  symptom of this.
- The bottom bar is `position: sticky; bottom: 0`, so it still stays on screen while
  the page scrolls behind it.
- Sheets and the targets modal stay `position: fixed` — as short-lived overlays they
  are unaffected — and now lock the page behind them so it cannot scroll underneath.
- **Status bar style changed from `black-translucent` to `black`.** With
  `black-translucent` the content runs underneath the status bar and the layout then
  adds `safe-area-inset-top` on top of that, so the top spacing was applied twice.
  With `black`, iOS reserves the status bar itself and the inset resolves to zero.

### Removed
- The `--app-h` JavaScript height measurement from v0.2.0. With flow layout there is
  no height to measure. The value is still shown in Display info for reference.

---

## [0.2.0] — 2026-08-08

Two separate iOS bugs, both found from side-by-side Android and iPhone screenshots
of the add-entry screen.

### Fixed
- **Rows sliced in half on the add screen.** The repeat chips and the source tiles
  were being rendered at half height with their contents cut off. The sheet is a
  flex column, and flex items shrink by default when the content is taller than the
  container — so iOS compressed every row proportionally instead of scrolling.
  Android had enough room that it never triggered. Every row in a sheet is now
  `flex-shrink: 0`, and the middle of the add screen is a single scrollable region
  between the fixed tabs at the top and the fixed Save button at the bottom.
  Nothing can be clipped now regardless of screen height.
- **Band under the bottom bar in standalone mode.** The app height now comes from
  `window.innerHeight`, measured in JavaScript and written to `--app-h`. In iOS
  standalone with `viewport-fit=cover` that is the one height reported correctly —
  it includes the safe areas and the space the browser toolbar used to occupy.
  `visualViewport.height`, used in v0.1.6, under-reports and caused the band.
  The height is re-measured on resize, rotation, `pageshow`, on returning to the
  foreground, and twice shortly after launch, because iOS settles its viewport a
  beat after the app opens.
- The bottom bar returns to being the last item in the flex column. Pinning it with
  `position:fixed` in v0.1.8 was working around the height problem rather than
  fixing it.

### Added
- `--app-h` shown in the Display info panel under More.

---

## [0.1.9] — 2026-08-08

Diagnostics, not another guess.

### Context
Chrome on iOS renders the layout correctly — the nav sits flush above the browser
toolbar with no gap. Chrome on Android is correct too. The band only appears once
the app is installed to the iOS home screen, and it is roughly the height of the
browser toolbar that is no longer there. That points at iOS reporting a viewport in
standalone mode as though the toolbar were still present.

### Added
- **Display info panel** under More. Shows `screen.height`, `innerHeight`,
  `visualViewport.height`, `documentElement.clientHeight`, the resolved
  `safe-area-inset-bottom`, the nav's measured bottom edge, and the deficit between
  screen and viewport. Four attempts have now been made at this bug without knowing
  which of those numbers disagree. This ends that.

### Not changed
The layout itself is untouched from v0.1.8. Nothing should be altered again until
the measurements say what to alter.

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
