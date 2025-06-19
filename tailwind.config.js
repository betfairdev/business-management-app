import flowbitePlugin from 'flowbite/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  // Use class="dark" on <html> (or any wrapper) to activate dark styles
  darkMode: 'class',

  // Where to scan for utility classes
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/flowbite/**/*.js',   // Flowbite’s core scripts
  ],
  theme: {},

  // core Flowbite plugin: adds its components & utilities
  plugins: [
    flowbitePlugin,
  ],
}
