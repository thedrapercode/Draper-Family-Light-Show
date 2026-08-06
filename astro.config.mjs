import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://draperlightshow.com',
  output: 'static',
  adapter: cloudflare({
    platformProxy: { enabled: false },
    session: false,
    imageService: 'passthrough',
  }),
  integrations: [react(), keystatic()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['@cloudflare/unenv-preset'],
    },
  },
});
