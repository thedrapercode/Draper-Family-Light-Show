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

function isSlotPast(date: string, slotTime: string): boolean {
  const month = parseInt(date.split('-')[1], 10);
  const utcOffsetHours = month >= 3 && month <= 11 ? 4 : 5;
  const slotAsUtcMs = Date.parse(`${date}T${slotTime}:00Z`);
  const actualUtcMs = slotAsUtcMs + utcOffsetHours * 3600000;
  return actualUtcMs <= Date.now();
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

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    if (!date || !ticketing.showDates.includes(date)) {
      return new Response(JSON.stringify({ error: 'Invalid date' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allSlots = generateSlots(ticketing.slotStartTime, ticketing.slotEndTime, ticketing.slotDurationMinutes);
    const slots = allSlots.filter((s) => !isSlotPast(date, s));

    const db = await getDB();

    if (!db) {
      return new Response(
        JSON.stringify(slots.map((time) => ({ time, available: ticketing.slotCapacity }))),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await db
      .prepare('SELECT slot_time, SUM(guests) as booked FROM reservations WHERE date = ? GROUP BY slot_time')
      .bind(date)
      .all();

    const booked: Record<string, number> = {};
    for (const row of result.results) {
      booked[row.slot_time as string] = row.booked as number;
    }

    const availability = slots.map((time) => ({
      time,
      available: Math.max(0, ticketing.slotCapacity - (booked[time] ?? 0)),
    }));

    return new Response(JSON.stringify(availability), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[availability]', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
