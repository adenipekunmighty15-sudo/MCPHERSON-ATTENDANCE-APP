'use client'

import { useEffect, useRef } from 'react'

export default function ScrollProgress() {
  const barRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const node = barRef.current
      if (!node) return
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      node.style.transform = `scaleX(${Math.min(1, Math.max(0, window.scrollY / max)).toFixed(4)})`
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <div className="next-scroll-progress" aria-hidden="true">
      <span ref={barRef} />
    </div>
  )
}
