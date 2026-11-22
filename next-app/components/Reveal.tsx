'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

/**
 * Progressive-enhancement reveal.
 *
 * The server renders fully visible content. Only after hydration does the
 * component arm the entrance animation, and even then a failsafe timer plus
 * scroll/resize/page-show listeners guarantee the content is revealed. A
 * stalled bundle, blocked observer or frozen scroll can no longer leave the
 * page blank.
 */
export default function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    let observer: IntersectionObserver | null = null
    let failsafe = 0

    const reveal = () => {
      if (node.dataset.revealed === 'true') return
      node.dataset.revealed = 'true'
      observer?.disconnect()
      window.clearTimeout(failsafe)
      window.removeEventListener('pageshow', reveal)
      window.removeEventListener('resize', reveal)
      window.removeEventListener('scroll', reveal)
    }

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      reveal()
      return
    }

    // Arm only when we can observe AND a timer is ready to force the reveal.
    node.dataset.armed = 'true'

    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) reveal()
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    )
    observer.observe(node)

    failsafe = window.setTimeout(reveal, 1200)
    window.addEventListener('pageshow', reveal)
    window.addEventListener('resize', reveal, { passive: true })
    window.addEventListener('scroll', reveal, { passive: true })

    return () => {
      observer.disconnect()
      window.clearTimeout(failsafe)
      window.removeEventListener('pageshow', reveal)
      window.removeEventListener('resize', reveal)
      window.removeEventListener('scroll', reveal)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
