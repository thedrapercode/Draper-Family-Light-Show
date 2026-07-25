import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://draperlightshow.com',
  integrations: [tailwind()],
});
