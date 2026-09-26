/* SE Budget — delete-account
   ---------------------------------------------------------------
   Permanently deletes the signed-in caller's account.

   Entries, settings and the profile row all reference auth.users with
   "on delete cascade" (see schema.sql), so deleting the auth user is
   enough — the database removes everything else tied to it on its own.
   No id is ever taken from the request body; the only account this can
   possibly delete is the one that owns the bearer token making the call.
   --------------------------------------------------------------- */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') {
    return Response.json({ ok: false, message: 'Method not allowed' }, { status: 405, headers: cors });
  }

  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return Response.json({ ok: false, message: 'Not signed in' }, { status: 401, headers: cors });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: userData, error: userErr } = await admin.auth.getUser(auth.replace('Bearer ', ''));
  if (userErr || !userData?.user) {
    return Response.json({ ok: false, message: 'Not signed in' }, { status: 401, headers: cors });
  }

  const { error } = await admin.auth.admin.deleteUser(userData.user.id);
  if (error) {
    console.error('delete-account error', error.message || error);
    return Response.json({ ok: false, message: 'Could not delete the account' }, { status: 500, headers: cors });
  }

  return Response.json({ ok: true }, { headers: cors });
});
