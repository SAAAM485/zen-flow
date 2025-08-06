/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#F5F5F5',
        'secondary-bg': '#EBEBEB',
        'primary-text': '#3D3D3D',
        'secondary-text': '#474747',
        'border-line': '#525252',
      },
    },
  },
  plugins: [],
};

export default config;
