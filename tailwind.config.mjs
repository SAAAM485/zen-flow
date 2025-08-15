/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      spacing: {
        'xs': '0.25rem', // 4px
        'sm': '0.5rem',  // 8px
        'md': '1rem',   // 16px
        'lg': '1.5rem',  // 24px
        'xl': '2rem',   // 32px
      },
      lineHeight: {
        'tight': '1.2',
        'normal': '1.5',
        'loose': '1.8',
      },
      letterSpacing: {
        'tight': '-0.02em',
        'normal': '0',
        'wide': '0.02em',
      },
      colors: {
        'primary-bg': 'var(--color-primary-bg)',
        'secondary-bg': 'var(--color-secondary-bg)',
        'primary-text': 'var(--color-primary-text)',
        'secondary-text': 'var(--color-secondary-text)',
        'border-line': 'var(--color-border-line)',
        'highlighted-bg': 'var(--color-highlighted-bg)',
      },
    },
  },
  plugins: [],
};

export default config;
