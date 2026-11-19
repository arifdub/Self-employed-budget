/* SE Budget — analytics
   ---------------------------------------------------------------
   Loads Google Analytics only when a measurement ID is set in config.js,
   so the app runs perfectly well with analytics switched off.

   GDPR note: you are in Ireland, so the ePrivacy Regulation applies. Google
   Analytics writes cookies and sends identifiers to Google, which means you need
   consent BEFORE it loads — not a banner that appears while it is already
   running. This file therefore waits for a stored consent choice and does
   nothing until it gets one.

   This same choice also gates the basic anonymous visit counter (visit.js,
   shared across every page on this site) — so the prompt below is asked
   regardless of whether Google Analytics itself is configured, otherwise the
   visit counter would never get a chance to be allowed.
   --------------------------------------------------------------- */
(function () {
  var cfg = window.SEB_CONFIG || {};
  var ID = cfg.gaMeasurementId;
  var hasGA = !!ID && ID.indexOf('G-') === 0;

  var KEY = 'seb.consent.v1';
  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}

  function loadGA() {
    if (!hasGA) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', ID, { anonymize_ip: true });
  }

  function remember(val) {
    try { localStorage.setItem(KEY, val); } catch (e) {}
  }

  if (choice === 'yes') { loadGA(); return; }
  if (choice === 'no') return;

  /* First visit: ask. Deliberately small and out of the way — a full-screen
     interruption before someone has seen the app costs more than the data. */
  window.addEventListener('load', function () {
    var bar = document.createElement('div');
    bar.className = 'consent';
    bar.innerHTML =
      '<span>We use basic analytics (and a simple visit counter) to see how many people use the app. No personal data, and nothing about your entries.</span>' +
      '<span class="consentBtns">' +
        '<button id="cNo">No thanks</button>' +
        '<button id="cYes" class="primary">Allow</button>' +
      '</span>';
    document.body.appendChild(bar);
    requestAnimationFrame(function () { bar.classList.add('on'); });

    document.getElementById('cYes').onclick = function () {
      remember('yes'); loadGA(); bar.remove();
    };
    document.getElementById('cNo').onclick = function () {
      remember('no'); bar.remove();
    };
  });
})();
