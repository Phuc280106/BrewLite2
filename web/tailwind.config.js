/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#FDF8F5',
          100: '#F7EDE6',
          200: '#EBD5C6',
          300: '#DCB69D',
          400: '#C7906E',
          500: '#A46843',
          600: '#8A502F',
          700: '#6E3E23',
          800: '#542E19',
          900: '#3D1F10',
        },
      },
    },
  },
  plugins: [],
};
