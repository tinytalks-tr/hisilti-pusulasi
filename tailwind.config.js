/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        krem: '#F7F1E8',
        kremKoyu: '#EDE3D4',
        mercan: '#E8A87C',
        mercanKoyu: '#D98E5C',
        teal: '#5B8A8A',
        tealKoyu: '#47706F',
        lacivert: '#2D3142',
        lacivertYumusak: '#4A4F66',
      },
      fontFamily: {
        baslik: ['Fraunces', 'Georgia', 'serif'],
        govde: ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        yumusak: '0 1px 2px rgba(45,49,66,.06), 0 12px 28px -14px rgba(45,49,66,.28)',
      },
    },
  },
  plugins: [],
}
