import type { APIRoute } from 'astro';
import ticketing from '../../../content/ticketing/settings.json';

export const prerender = false;

function generateSlots(start: string, end: string, duration: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let minutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  while (minutes < endMinutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    minutes += duration;
  }
  return slots;
}

async function getDB(): Promise<D1Database | undefined> {
  if (import.meta.env.DEV) return undefined;
  try {
    const { env } = await import('cloudflare:workers');
    return (env as any).DB;
  } catch {
    return undefined;
  }
}

function fmtDateEmail(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function fmtTimeEmail(t: string) {
  const [h, m] = t.split(':').map(Number);
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

async function sendConfirmationEmail(opts: {
  to: string; name: string; date: string; slotTime: string;
  guests: number; donationCents: number; confirmationCode: string;
}) {
  const resendKey = import.meta.env.RESEND_API_KEY;
  const fromEmail = import.meta.env.RESEND_FROM_EMAIL || 'tickets@draperlightshow.com';
  if (!resendKey) return; // silently skip if not configured

  const donationLine = opts.donationCents > 0
    ? `<tr><td style="padding:6px 0;color:#888;font-size:14px">Donation</td><td style="padding:6px 0;font-size:14px;text-align:right;font-weight:600;color:#e8613a">$${(opts.donationCents / 100).toFixed(0)} to ${ticketing.donationCharity}</td></tr>`
    : '';

  const html = `<!doctype html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a12;font-family:Inter,system-ui,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a12;padding:32px 16px">
<tr><td align="center">
<table width="100%" style="max-width:480px;background:#111118;border-radius:16px;border:1px solid #2a2a3a;overflow:hidden">
  <tr><td style="background:#e8613a;padding:24px 32px;text-align:center">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.7)">Draper Family Light Show</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#fff">${ticketing.eventName}</h1>
  </td></tr>
  <tr><td style="padding:28px 32px">
    <p style="margin:0 0 4px;font-size:13px;color:#888">Hi ${opts.name},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#e8e8f0">You're on the list! Here are your details.</p>

    <div style="background:#0a0a12;border:1px solid #2a2a3a;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#888">Confirmation Code</p>
      <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:0.15em;color:#e8613a;font-family:monospace">${opts.confirmationCode}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #2a2a3a">
      <tr><td style="padding:6px 0;color:#888;font-size:14px">Date</td><td style="padding:6px 0;font-size:14px;text-align:right;font-weight:600;color:#e8e8f0">${fmtDateEmail(opts.date)}</td></tr>
      <tr><td style="padding:6px 0;color:#888;font-size:14px">Time</td><td style="padding:6px 0;font-size:14px;text-align:right;font-weight:600;color:#e8e8f0">${fmtTimeEmail(opts.slotTime)}</td></tr>
      <tr><td style="padding:6px 0;color:#888;font-size:14px">Group</td><td style="padding:6px 0;font-size:14px;text-align:right;font-weight:600;color:#e8e8f0">${opts.guests} ${opts.guests === 1 ? 'person' : 'people'}</td></tr>
      <tr><td style="padding:6px 0;color:#888;font-size:14px">Location</td><td style="padding:6px 0;font-size:14px;text-align:right;font-weight:600;color:#e8e8f0">352 N Cherry St, Kenton, OH</td></tr>
      ${donationLine}
    </table>

    <div style="margin-top:24px;padding:16px 20px;background:#0a0a12;border-radius:10px;border:1px solid #2a2a3a">
      <p style="margin:0;font-size:13px;color:#aaa;line-height:1.6">${ticketing.confirmationEmailMessage}</p>
    </div>
  </td></tr>
  <tr><td style="padding:16px 32px;border-top:1px solid #2a2a3a;text-align:center">
    <p style="margin:0;font-size:11px;color:#555">Draper Family Light Show &middot; Kenton, Ohio</p>
    <p style="margin:4px 0 0;font-size:11px;color:#555">Tickets are free. This is a family-run event. Questions? Reply to this email.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Draper Family Light Show <${fromEmail}>`,
        to: [opts.to],
        subject: ticketing.confirmationEmailSubject,
        html,
      }),
    });
  } catch {
    // Email failure must never block the reservation from completing
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { date, slotTime, name, email, guests, donationCents, squareToken } = body as {
      date: string; slotTime: string; name: string; email: string;
      guests: number; donationCents: number; squareToken?: string | null;
    };

    if (!date || !slotTime || !name || !email || !guests) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ticketing.showDates.includes(date)) {
      return new Response(JSON.stringify({ error: 'Invalid date' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validSlots = generateSlots(ticketing.slotStartTime, ticketing.slotEndTime, ticketing.slotDurationMinutes);
    if (!validSlots.includes(slotTime)) {
      return new Response(JSON.stringify({ error: 'Invalid time slot' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = await getDB();

    if (db) {
      const row = await db
        .prepare('SELECT SUM(guests) as booked FROM reservations WHERE date = ? AND slot_time = ?')
        .bind(date, slotTime)
        .first<{ booked: number }>();
      const booked = row?.booked ?? 0;
      if (booked + Number(guests) > ticketing.slotCapacity) {
        return new Response(
          JSON.stringify({ error: 'That time slot is now full. Please go back and choose another time.' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    let squarePaymentId: string | null = null;

    if (Number(donationCents) > 0 && squareToken) {
      const isTest = ticketing.squareMode === 'sandbox';
      const squareBase = isTest
        ? 'https://connect.squareupsandbox.com'
        : 'https://connect.squareup.com';
      const accessToken = isTest
        ? import.meta.env.SQUARE_ACCESS_TOKEN_SANDBOX
        : import.meta.env.SQUARE_ACCESS_TOKEN_PRODUCTION;

      const payRes = await fetch(`${squareBase}/v2/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18',
        },
        body: JSON.stringify({
          source_id: squareToken,
          amount_money: { amount: Number(donationCents), currency: 'USD' },
          idempotency_key: crypto.randomUUID(),
          note: `Donation to ${ticketing.donationCharity} via ${ticketing.eventName}`,
        }),
      });

      if (!payRes.ok) {
        return new Response(
          JSON.stringify({ error: 'Payment failed. Please check your card details and try again.' }),
          { status: 402, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const payData = await payRes.json() as { payment?: { id: string } };
      squarePaymentId = payData.payment?.id ?? null;
    }

    const id = crypto.randomUUID();
    const confirmationCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const createdAt = new Date().toISOString();

    if (db) {
      await db
        .prepare(
          'INSERT INTO reservations (id, date, slot_time, name, email, guests, donation_cents, square_payment_id, confirmation_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(id, date, slotTime, name, email, Number(guests), Number(donationCents) ?? 0, squarePaymentId, confirmationCode, createdAt)
        .run();
    }

    // Send confirmation email via Resend
    await sendConfirmationEmail({
      to: email as string,
      name: name as string,
      date: date as string,
      slotTime: slotTime as string,
      guests: Number(guests),
      donationCents: Number(donationCents) ?? 0,
      confirmationCode,
    });

    return new Response(JSON.stringify({ success: true, confirmationCode }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[reserve]', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
