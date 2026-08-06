/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        midnight: '#191970',
        midnightdark: '#0f0f45',
      },
      fontFamily: {
        display: ['"Mountains of Christmas"', 'cursive'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
