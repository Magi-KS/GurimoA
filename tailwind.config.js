module.exports = {
  purge: {
    enabled: true,
    content: ['./src/views/*.eta', './src/contents/*.html']
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    screens: {
      'sm': '640px',
      // => @media (min-width: 640px) { ... }
      'md': '768px',
      // => @media (min-width: 768px) { ... }
      'lg': '1024px',
      // => @media (min-width: 1024px) { ... }
      'xl': '1280px',
      // => @media (min-width: 1280px) { ... }
      // '2xl': '1536px',
      // // => @media (min-width: 1536px) { ... }
    },
    container: {
      center: true,
    },
    extend: {
      backgroundImage: {
        'paper-texture': "url('/src/contents/img/paper-texture.png')",
      }
    },
  },
  variants: {},
  plugins: [],
}
