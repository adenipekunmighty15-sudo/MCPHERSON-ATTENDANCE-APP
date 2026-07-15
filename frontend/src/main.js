import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from 'motion-v'
import { vConfetti } from '@neoconfetti/vue'
import App from './App.vue'
import router from './router'
import ErrorBoundary from './components/ErrorBoundary.vue'
import './index.css'
import './styles/design-system.css'

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
app.component('ErrorBoundary', ErrorBoundary)
app.mount('#root')

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
