import { ref } from 'vue'

const THEME_KEY = 'mcu_theme'

const isDark = ref(true)

function apply() {
  const root = document.documentElement
  if (isDark.value) {
    root.setAttribute('data-theme', 'dark')
    root.classList.add('dark')
  } else {
    root.setAttribute('data-theme', 'light')
    root.classList.remove('dark')
  }
  localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
}

function toggle() {
  isDark.value = !isDark.value
  apply()
}

function setTheme(theme) {
  isDark.value = theme === 'dark'
  apply()
}

function getSystemPreference() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
}

function init() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved) {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = getSystemPreference()
  }
  apply()
}

init()

window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem(THEME_KEY)) {
    isDark.value = e.matches
    apply()
  }
})

export function useTheme() {
  return { isDark, toggle, setTheme, init }
}
