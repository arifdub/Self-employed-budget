/* SE Budget — admin-stats
   ---------------------------------------------------------------
   Returns aggregate usage figures for the admin page.

   Two rules this function exists to enforce:

   1. The caller must be signed in AND listed in public.admins. The check uses
      the caller's own JWT, so a stolen anon key is not enough.

   2. Only counts and dates leave this function. No amounts, no categories, no
      email addresses. Someone else's income is not the owner's to read, and a
      dashboard does not need it to be useful.
   --------------------------------------------------------------- */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return Response.json({ ok: false, message: 'Not signed in' }, { status: 401, headers: cors });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Who is asking?
  const { data: userData, error: userErr } = await admin.auth.getUser(auth.replace('Bearer ', ''));
  if (userErr || !userData?.user) {
    return Response.json({ ok: false, message: 'Not signed in' }, { status: 401, headers: cors });
  }

  // Are they allowed?
  const { data: isAdmin } = await admin
    .from('admins').select('user_id').eq('user_id', userData.user.id).maybeSingle();

  if (!isAdmin) {
    return Response.json({ ok: false, message: 'Not an admin' }, { status: 403, headers: cors });
  }

  const day = 86400000;
  const since = (d: number) => new Date(Date.now() - d * day).toISOString();

  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const list = users?.users ?? [];

  const { data: entries } = await admin
    .from('entries')
    .select('user_id, created_at, occurred_at, type')
    .is('deleted_at', null);

  const rows = entries ?? [];
  const withEntries = new Set(rows.map(r => r.user_id));
  const activeSince = (d: number) =>
    new Set(rows.filter(r => r.created_at > since(d)).map(r => r.user_id)).size;

  // How many distinct days each person has logged on — the clearest signal of
  // whether someone actually adopted the app or simply tried it.
  const daysPerUser = new Map<string, Set<string>>();
  rows.forEach(r => {
    const k = r.user_id;
    if (!daysPerUser.has(k)) daysPerUser.set(k, new Set());
    daysPerUser.get(k)!.add(String(r.occurred_at).slice(0, 10));
  });
  const dayCounts = [...daysPerUser.values()].map(s => s.size);

  // Sign-ups per week, most recent first.
  const weeks: Record<string, number> = {};
  list.forEach(u => {
    const d = new Date(u.created_at);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    weeks[key] = (weeks[key] || 0) + 1;
  });

  return Response.json({
    ok: true,
    users: {
      total: list.length,
      new_7d: list.filter(u => u.created_at > since(7)).length,
      new_30d: list.filter(u => u.created_at > since(30)).length,
      signed_in_7d: list.filter(u => u.last_sign_in_at && u.last_sign_in_at > since(7)).length,
      ever_logged: withEntries.size,
      active_7d: activeSince(7),
      active_30d: activeSince(30),
    },
    retention: {
      one_day_only: dayCounts.filter(n => n === 1).length,
      few_days: dayCounts.filter(n => n >= 2 && n <= 6).length,
      seven_plus: dayCounts.filter(n => n >= 7).length,
    },
    entries: {
      total: rows.length,
      added_7d: rows.filter(r => r.created_at > since(7)).length,
      income: rows.filter(r => r.type === 'income').length,
      business: rows.filter(r => r.type === 'business').length,
      personal: rows.filter(r => r.type === 'personal').length,
      per_user: withEntries.size ? +(rows.length / withEntries.size).toFixed(1) : 0,
    },
    signups_by_week: Object.entries(weeks).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8),
  }, { headers: cors });
});
