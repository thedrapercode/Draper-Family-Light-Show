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
      const isTest = import.meta.env.PUBLIC_TEST_MODE === 'true';
      const squareBase = isTest
        ? 'https://connect.squareupsandbox.com'
        : 'https://connect.squareup.com';

      const payRes = await fetch(`${squareBase}/v2/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.SQUARE_ACCESS_TOKEN}`,
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
