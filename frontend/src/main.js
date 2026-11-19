import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from 'motion-v'
import { vConfetti } from '@neoconfetti/vue'
import Lenis from 'lenis'
import App from './App.vue'
import router from './router'
import * as Components from './components'
import safeHtml from './directives/safeHtml'
import './index.css'
import './design-kit/tokens.css'


// Global error handler for non-Vue errors (images, etc.)
window.addEventListener('error', (e) => {
  if (e.target?.tagName === 'IMG' || e.target?.tagName === 'SOURCE') {
    e.preventDefault()
  }
})

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error:', err, info)
  import('./stores/toast').then(({ useToastStore }) => {
    const toast = useToastStore()
    if (toast.show) toast.show(err?.message || 'An unexpected error occurred', 'error')
  }).catch(() => {})
}

app.use(createPinia())
app.use(router)
app.use(MotionPlugin)
app.directive('confetti', vConfetti)
app.directive('safe-html', safeHtml)

// Auto-register global UI components
Object.entries(Components).forEach(([name, component]) => {
  app.component(name, component)
})

app.mount('#root')

// Initialize Lenis smooth scrolling
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
})

function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const hadController = !!navigator.serviceWorker.controller
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !reloading) {
        reloading = true
        window.location.reload()
      }
    })
    navigator.serviceWorker.register('/sw.js')
      .then(registration => registration.update())
      .catch(() => {})
    window.addEventListener('focus', () => {
      navigator.serviceWorker.getRegistration().then(registration => registration?.update()).catch(() => {})
    })
  })
}
