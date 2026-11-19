import { sanitizeHtml } from '../lib/sanitize.js'

function setSafeHtml(element, binding) {
  element.innerHTML = sanitizeHtml(binding.value)
}

export default {
  mounted: setSafeHtml,
  updated: setSafeHtml,
}
