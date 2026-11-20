'use client'

import { useEffect, useState } from 'react'

export default function CursorSpotlight() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setEnabled(true)

    let frame = 0
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2

    const render = () => {
      frame = 0
      document.documentElement.style.setProperty('--cursor-x', `${x.toFixed(1)}px`)
      document.documentElement.style.setProperty('--cursor-y', `${y.toFixed(1)}px`)
    }

    const move = (event: PointerEvent) => {
      x = event.clientX
      y = event.clientY
      if (!frame) frame = requestAnimationFrame(render)
    }

    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', move)
      document.documentElement.style.removeProperty('--cursor-x')
      document.documentElement.style.removeProperty('--cursor-y')
    }
  }, [])

  if (!enabled) return null
  return <div className="cursor-spotlight" aria-hidden="true" />
}
