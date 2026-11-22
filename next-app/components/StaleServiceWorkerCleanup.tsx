'use client'

import { useEffect } from 'react'

const CLEANUP_KEY = 'mcu-stale-sw-cleanup-v1'

/**
 * Earlier deployments of this origin registered a Vue service worker at /sw.js.
 * A stale worker can keep serving cached HTML/CSS after a new deploy and make
 * the page look blank. Remove any leftover registration once per tab session.
 */
export default function StaleServiceWorkerCleanup() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let alreadyDone = false
    try {
      alreadyDone = sessionStorage.getItem(CLEANUP_KEY) === '1'
    } catch {
      // Storage can be blocked; continue with the cleanup below.
    }
    if (alreadyDone) return
    try {
      sessionStorage.setItem(CLEANUP_KEY, '1')
    } catch {
      // Ignore storage failures.
    }

    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (!registrations.length) return
      const wasControlled = Boolean(navigator.serviceWorker.controller)
      void Promise.all(registrations.map((registration) => registration.unregister()))
        .then(() => {
          if (wasControlled) window.location.reload()
        })
        .catch(() => {})
    }).catch(() => {})
  }, [])

  return null
}
