module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      scrollbar: {
        hide: {
          '-webkit-scrollbar': {
            display: 'none',
          },
          '-ms-overflow-style': 'none', // IE এবং Edge
          'scrollbar-width': 'none', // Firefox
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-webkit-scrollbar': 'none',
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
      });
    },
  ],
};