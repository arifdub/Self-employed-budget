/* SE Budget — service worker
   ---------------------------------------------------------------
   NETWORK FIRST for the app's own code.

   The previous version was cache-first: it served whatever it had stored and
   only looked for new files when CACHE was renamed by hand. Forget that one
   line and every phone keeps running old code indefinitely, however many times
   the site deploys. That is why updates were not arriving.

   Now index.html, app.js, app.css and the manifest are fetched from the network
   every time, with the cache used only when the network fails. A deploy reaches
   phones on the next launch, with nothing to remember and nothing for users to
   clear. Offline still works, because the last good copy is always kept.

   Icons stay cache-first — they are large, rarely change, and their filenames
   carry a version suffix when they do.
   --------------------------------------------------------------- */

const VERSION = 'v1.4.0';
const SHELL   = 'seb-shell-' + VERSION;   // fallback copies of the code
const ASSETS  = 'seb-assets-v2';          // icons, fonts

/* Files that must always be current. */
const CODE = [
  './',
  './index.html',
  './app.js',
  './app.css',
  './config.js',
  './analytics.js',
  './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL)
      .then(c => c.addAll(CODE).catch(() => {}))   // a missing optional file must not abort the install
      .then(() => self.skipWaiting())              // take over immediately, do not wait for tabs to close
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL && k !== ASSETS).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Allow the page to force an immediate takeover after an update is found. */
self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

const isCode = url =>
  url.origin === location.origin &&
  (url.pathname === '/' ||
   /\.(?:html|js|css|webmanifest)$/.test(url.pathname));

const isAsset = url =>
  url.origin === location.origin && /\.(?:png|svg|ico|webp|woff2?)$/.test(url.pathname);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* Never touch these. Auth tokens and analytics must always reach the network,
     and a cached response would be both stale and wrong. */
  if (url.hostname.endsWith('.supabase.co') ||
      url.hostname.endsWith('googletagmanager.com') ||
      url.hostname.endsWith('google-analytics.com') ||
      url.pathname.startsWith('/_vercel/')) return;

  /* App code: network first, cache only as a fallback. */
  if (isCode(url)) {
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => {
          const copy = res.clone();
          caches.open(SHELL).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then(hit => hit || caches.match('./index.html'))
        )
    );
    return;
  }

  /* Icons and fonts: cache first, they are big and change rarely. */
  if (isAsset(url) || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(ASSETS).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }))
    );
    return;
  }

  /* Anything else: try the network, fall back to whatever is stored. */
  e.respondWith(fetch(req).catch(() => caches.match(req)));
});
