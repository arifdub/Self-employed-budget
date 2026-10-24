/* SE Budget — anonymous page-view counter
   ---------------------------------------------------------------
   Logs a single row (page path + a random id the browser makes up for
   itself, never tied to an account) so the admin dashboard can show how
   many people land on the site and which page they land on. No cookies,
   no IP captured by the app, nothing that identifies a person — just a
   count. Fails silently; a visitor counter is never worth breaking a page
   over.
   --------------------------------------------------------------- */
(function () {
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
