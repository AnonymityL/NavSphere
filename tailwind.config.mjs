/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        prod: {
          DEFAULT: '#10b981',
          light: '#d1fae5'
        },
        staging: {
          DEFAULT: '#8b5cf6',
          light: '#ede9fe'
        },
        test: {
          DEFAULT: '#3b82f6',
          light: '#dbeafe'
        }
      }
    },
  },
  plugins: [],
}
