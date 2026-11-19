/* SE Budget — anonymous page-view counter
   ---------------------------------------------------------------
   Logs a single row (page path + a random id the browser makes up for
   itself, never tied to an account) so the admin dashboard can show how
   many people land on the site and which page they land on. No cookies,
   no IP captured by the app, nothing that identifies a person — just a
   count. Fails silently; a visitor counter is never worth breaking a page
   over.

   Gated on the SAME consent choice as Google Analytics ('seb.consent.v1'),
   because storing that random id in localStorage is "storing information
   on the user's device" under the ePrivacy Regulation just as much as a
   cookie would be — it needs consent first, not a banner that appears
   after it already ran. If that choice hasn't been made yet (e.g. someone
   landed straight on a calculator page without visiting the app first),
   nothing is recorded until they do visit the app and answer the prompt —
   the same storage key is shared across every page on this site.
   --------------------------------------------------------------- */
(function () {
  var CONSENT_KEY = 'seb.consent.v1';
  var consent = null;
  try { consent = localStorage.getItem(CONSENT_KEY); } catch (e) {}
  if (consent !== 'yes') return;

  var URL = 'https://wfuvnnpjsajiotmukwws.supabase.co';
  var ANON = 'sb_publishable_W3QSdM4LLwNJ21pYrptRRw_rqqKyjkW';
  var KEY = 'seb.visitor.id';
  var id;

  try {
    id = localStorage.getItem(KEY);
    if (!id) {
      id = window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : 'v-' + Date.now().toString(36) + Math.random().toString(36).slice(2);
      localStorage.setItem(KEY, id);
    }
  } catch (e) { id = 'anon'; }

  fetch(URL + '/rest/v1/page_views', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON,
      Authorization: 'Bearer ' + ANON,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ path: location.pathname, visitor_id: id }),
  }).catch(function () {});
})();
