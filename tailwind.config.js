module.exports = {
  purge: ['./src/**/*.tsx'],
  theme: {
    extend: {
      fontFamily: {
        sans: "'Lato', sans-serif",
        dot: "'DotGothic16', sans-serif",
      },
      minWidth: {
        40: '10rem',
      },
      boxShadow: {
        solid: '0.5rem 0.5rem var(--tw-shadow-color)'
      }
    },
  },
  variants: {},
  plugins: [],
}
