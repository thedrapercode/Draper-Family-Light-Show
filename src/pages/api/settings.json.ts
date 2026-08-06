import type { APIRoute } from 'astro';
import settings from '../../content/settings/site.json';

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(settings), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
