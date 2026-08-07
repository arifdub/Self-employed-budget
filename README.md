# Self Employed Budget

A daily earnings and expense tracker for self-employed people — drivers, trades, anyone
with income coming in and costs going out.

**Current version: v0.1.3** (see `CHANGELOG.md`)

---

## What it does right now

- Log income (Fare, Free Now, Uber, Others), business costs, and home costs
- Daily, weekly and monthly targets with a progress gauge and a pace marker
- Reports: income → business costs → net income → home costs → take-home
- Breakdowns by source and by category
- Installs to the phone home screen and opens full screen, no browser bar
- Works with no signal once it has been opened once

**Not yet:** entries disappear when the app is closed. Device storage lands in v0.2,
accounts and cloud sync in v0.3–v0.5.

---

## File structure

```
self-employed-budget/
├── index.html              the app
├── app.css                 all styling (night + day themes)
├── app.js                  all logic
├── manifest.webmanifest    makes it installable
├── sw.js                   service worker — offline + fast loading
├── icons/                  app icons
├── vercel.json             hosting + caching rules
├── .gitignore              what git should ignore
├── README.md               this file
└── CHANGELOG.md            version history
```

---

## How to put it online — GitHub + Vercel

The app is plain HTML, CSS and JavaScript. No build step, no server code.
Vercel serves it as a static site, gives you HTTPS automatically, and redeploys
every time you push to GitHub.

### One-time setup

**1. Create the repo**

On github.com, click **New repository**. Name it `self-employed-budget`. Keep it private if you like —
Vercel works with private repos. Do not add a README, since you already have one.

**2. Push this folder up**

```bash
cd self-employed-budget
git init
git add .
git commit -m "v0.1.3 — installable app shell"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/self-employed-budget.git
git push -u origin main
```

If you prefer clicking to typing, GitHub Desktop does the same thing: drag the folder in,
write the commit message, hit Publish.

**3. Connect Vercel**

- Go to vercel.com and sign in with GitHub
- **Add New → Project**, pick the `self-employed-budget` repo
- Framework Preset: **Other**
- Build Command: leave empty
- Output Directory: leave empty
- Click **Deploy**

About twenty seconds later you get a live HTTPS address like
`self-employed-budget-yourname.vercel.app`. That address already works for installing to a phone.

### Every change after that

```bash
git add .
git commit -m "what you changed"
git push
```

Vercel notices the push and redeploys on its own. No uploading, no File Manager.

### Connecting your domain

Buy the domain wherever you like — Namecheap, Cloudflare and Porkbun are all fine,
roughly €10–15 a year. Then:

1. Vercel → your project → **Settings → Domains**
2. Type the domain, click **Add**
3. Vercel shows you the DNS records to create
4. Paste those records into your registrar's DNS settings
5. Wait — usually minutes, occasionally a few hours

The HTTPS certificate is issued automatically. Nothing to configure.

### Testing on your own computer first

Opening `index.html` by double-clicking will show the app, but the service worker and
install prompt will not work — browsers block those on `file://`. To test properly:

```bash
cd self-employed-budget
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Service workers are allowed on localhost.

Or use the Vercel CLI, which matches production more closely:

```bash
npm i -g vercel
vercel dev
```

### About vercel.json

That file tells Vercel to never cache `sw.js`, `index.html` or the manifest, while caching
icons for a year. Without it, people would keep getting old versions after you push an update.
Leave it alone unless you know why you are changing it.

## Installing it on a phone

**Android (Chrome):** open the site, then either tap the install banner, or use
the ⋮ menu → **Add to Home screen**. The in-app button under **More → Install** also works.

**iPhone (Safari):** open the site, tap the **Share** button, scroll down, tap
**Add to Home Screen**. iOS does not support the automatic prompt, so the in-app
button shows a reminder instead.

Once installed it opens full screen with its own icon, like any other app.

---

## Releasing an update

Whenever you change any file:

1. Bump `APP_VERSION` at the top of `app.js`
2. Bump `CACHE` at the top of `sw.js` (e.g. `self-employed-budget-v0.2.0`)
3. Add an entry to `CHANGELOG.md`
4. `git add . && git commit -m "v0.2.0 — saves entries on the device" && git push`

Step 2 matters most. The service worker caches everything, so if the cache name does
not change, people keep seeing the old version even after a successful deploy.

Tip: work on a branch for anything risky. Push the branch and Vercel builds a private
preview address you can test on your phone without touching the live site. Merge to
`main` when you are happy.

## Roadmap

| Version | What it adds |
|---|---|
| v0.1 | Installable app shell ✅ |
| v0.2 | Entries save on the device, full entry history, edit and delete |
| v0.3 | Database — Supabase project, tables, security rules |
| v0.4 | Sign in with Google, Facebook or email |
| v0.5 | Cloud sync across devices |
| v0.6 | Per-user settings, currency, custom categories |
| v0.7 | Browse past weeks, months and years |
| v0.8 | CSV and PDF export, weekly report by email |
| v0.9 | Onboarding, empty states, error handling |
| v1.0 | Custom domain, privacy policy, public launch |
