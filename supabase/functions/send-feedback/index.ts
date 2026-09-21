/* SE Budget — send-feedback
   ---------------------------------------------------------------
   Forwards an in-app feedback message to the developer's inbox via
   Resend. No sign-in required — feedback should work for anyone
   using the app, not just people with an account.

   Needs the RESEND_API_KEY secret set on this project:
     supabase secrets set RESEND_API_KEY=re_xxx
   --------------------------------------------------------------- */

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
};

const TO = 'arifdub@gmail.com';
const MAX_LEN = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') {
    return Response.json({ ok: false, message: 'Method not allowed' }, { status: 405, headers: cors });
  }

  let body: { message?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, message: 'Invalid request' }, { status: 400, headers: cors });
  }

  const message = (body.message || '').trim();
  const replyTo = (body.email || '').trim();

  if (!message) {
    return Response.json({ ok: false, message: 'Message is empty' }, { status: 400, headers: cors });
  }
  if (message.length > MAX_LEN) {
    return Response.json({ ok: false, message: 'Message is too long' }, { status: 400, headers: cors });
  }
  // A reply-to address, not a login — a shape check is enough.
  if (replyTo && !EMAIL_RE.test(replyTo)) {
    return Response.json({ ok: false, message: 'That email address looks off' }, { status: 400, headers: cors });
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    return Response.json({ ok: false, message: 'Feedback is not configured yet' }, { status: 500, headers: cors });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'SE Budget feedback <onboarding@resend.dev>',
      to: TO,
      subject: 'SE Budget feedback',
      reply_to: replyTo || undefined,
      text: message,
    }),
  });

  if (!res.ok) {
    console.error('resend error', res.status, await res.text().catch(() => ''));
    return Response.json({ ok: false, message: 'Could not send right now' }, { status: 502, headers: cors });
  }

  return Response.json({ ok: true }, { headers: cors });
});
