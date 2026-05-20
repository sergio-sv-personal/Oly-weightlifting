// Vercel serverless function.
//
// Triggered by a Supabase Database Webhook on INSERT into public.comments.
// Sends an email via Resend to NOTIFY_EMAIL.
//
// Env vars expected (set in the Vercel project):
//   RESEND_API_KEY  — your Resend API key
//   NOTIFY_EMAIL    — destination email address (must match your Resend account
//                     unless you've verified a sending domain in Resend)
//   NOTIFY_SECRET   — shared secret. Supabase webhook must send this in the
//                     x-notify-secret header so randoms can't trigger emails.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.NOTIFY_SECRET;
  if (secret && req.headers['x-notify-secret'] !== secret) {
    return res.status(401).json({ error: 'Bad secret' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.NOTIFY_EMAIL;
  if (!apiKey || !toEmail) {
    return res.status(500).json({ error: 'Missing RESEND_API_KEY or NOTIFY_EMAIL' });
  }

  // Supabase webhook payload shape:
  // { type: 'INSERT', table: 'comments', record: {...}, old_record: null, schema: 'public' }
  const c = req.body?.record;
  if (!c || !c.body) {
    return res.status(400).json({ error: 'No comment record' });
  }

  const author = String(c.author || 'Someone');
  const body = String(c.body || '');
  const videoId = String(c.video_youtube_id || '');

  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:560px">
      <p style="font-size:13px;color:#666;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px">New comment · Sergio / Lifts</p>
      <h2 style="margin:0 0 12px">${escapeHtml(author)}</h2>
      <blockquote style="margin:0 0 16px;padding:12px 14px;border-left:3px solid #E94E1B;background:#faf6f1;white-space:pre-wrap">${escapeHtml(body)}</blockquote>
      <p style="font-size:13px;color:#666">Video: <code>${escapeHtml(videoId)}</code></p>
      <p style="font-size:13px"><a href="https://oly-weightlifting.vercel.app/" style="color:#E94E1B">Open the training log</a></p>
    </div>
  `;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'Lifts <onboarding@resend.dev>',
      to: toEmail,
      subject: `${author} commented on a lift`,
      html,
    }),
  });

  if (!resendRes.ok) {
    const text = await resendRes.text();
    return res.status(502).json({ error: 'Resend failed', detail: text });
  }

  return res.status(200).json({ ok: true });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
