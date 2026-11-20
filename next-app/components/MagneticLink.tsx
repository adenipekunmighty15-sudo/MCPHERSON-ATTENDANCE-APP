'use client'

import { useRef, type PointerEvent, type ReactNode } from 'react'

export default function MagneticLink({
  href,
  children,
  className = '',
  strength = 0.18,
}: {
  href: string
  children: ReactNode
  className?: string
  strength?: number
}) {
  const ref = useRef<HTMLAnchorElement>(null)

  const move = (event: PointerEvent<HTMLAnchorElement>) => {
    const node = ref.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = node.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const x = Math.max(-14, Math.min(14, (event.clientX - (rect.left + rect.width / 2)) * strength))
    const y = Math.max(-14, Math.min(14, (event.clientY - (rect.top + rect.height / 2)) * strength))
    node.style.setProperty('--mag-x', `${x.toFixed(2)}px`)
    node.style.setProperty('--mag-y', `${y.toFixed(2)}px`)
    node.style.setProperty('--origin-x', `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`)
    node.style.setProperty('--origin-y', `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`)
  }

  const leave = () => {
    const node = ref.current
    if (!node) return
    node.style.setProperty('--mag-x', '0px')
    node.style.setProperty('--mag-y', '0px')
  }

  return (
    <a ref={ref} href={href} className={`magnetic ${className}`} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </a>
  )
}
