/* SE Budget — configuration
   ---------------------------------------------------------------
   The anon key is designed to be public — it identifies your project
   in the browser and nothing more. It grants no access on its own,
   because the row-level security policies in schema.sql make the
   database itself refuse to return another user's rows.

   The service_role key is the opposite: it bypasses every policy.
   It must never appear in this file or anywhere in this repository.
   --------------------------------------------------------------- */
window.SEB_CONFIG = {
  url: 'https://wfuvnnpjsajiotmukwws.supabase.co',

  // Supabase → Settings → API → Project API keys → "anon public"
  // Replace the line below with that key.
  anonKey: 'sb_publishable_W3QSdM4LLwNJ21pYrptRRw_rqqKyjkW',

  // Google Analytics measurement ID, e.g. 'G-XXXXXXXXXX'.
  // Leave empty and no analytics code loads at all.
  gaMeasurementId: 'G-FBLBZ5VV9Q'
};
