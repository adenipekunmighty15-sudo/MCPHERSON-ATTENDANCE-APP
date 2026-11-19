import { h } from 'vue'

// Precompiled SVG icon factory.
//
// The app ships a strict Content-Security-Policy (`script-src 'self'`) with no
// `unsafe-eval`. Vue's full runtime build compiles `template:` strings with
// `new Function`, which that policy blocks. Defining icons as render functions
// keeps them compiled at build time and lets us use the runtime-only Vue build.
export function svgIcon(elements, options = {}) {
  const {
    width = 20,
    height = 20,
    strokeWidth = 2,
    linecap = 'butt',
    linejoin = 'miter',
  } = options

  return {
    name: 'InlineSvgIcon',
    setup() {
      return () => h(
        'svg',
        {
          width,
          height,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': strokeWidth,
          'stroke-linecap': linecap,
          'stroke-linejoin': linejoin,
        },
        elements.map(([tag, attrs = {}]) => h(tag, attrs)),
      )
    },
  }
}
