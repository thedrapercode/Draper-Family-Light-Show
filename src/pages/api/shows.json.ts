import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const shows = await getCollection('shows');
  const data = shows
    .sort((a, b) => a.data.order - b.data.order)
    .map((show) => ({
      id: show.id,
      ...show.data,
    }));

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
