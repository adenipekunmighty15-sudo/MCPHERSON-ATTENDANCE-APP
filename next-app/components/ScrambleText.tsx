'use client'

import { useEffect, useRef, useState } from 'react'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&$@?'

export default function ScrambleText({
  text,
  className = '',
  speed = 34,
}: {
  text: string
  className?: string
  speed?: number
}) {
  const [display, setDisplay] = useState(text)
  const ref = useRef<HTMLSpanElement>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let iteration = 0
    const tick = () => {
      const output = text
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' '
          if (iteration > index * 2) return char
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        })
        .join('')

      setDisplay(output)
      iteration += 1

      if (iteration < text.length * 2 + 8) {
        timer.current = window.setTimeout(tick, speed)
      } else {
        timer.current = null
        setDisplay(text)
      }
    }

    timer.current = window.setTimeout(tick, 260)
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [text, speed])

  const replay = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (timer.current !== null) window.clearTimeout(timer.current)

    let iteration = 0
    const tick = () => {
      const output = text
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' '
          if (iteration > index * 2) return char
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        })
        .join('')

      setDisplay(output)
      iteration += 1
      if (iteration < text.length * 2 + 8) {
        timer.current = window.setTimeout(tick, speed)
      } else {
        timer.current = null
        setDisplay(text)
      }
    }
    tick()
  }

  return (
    <span
      ref={ref}
      className={`scramble-text ${className}`}
      onMouseEnter={replay}
      onFocus={replay}
      tabIndex={0}
      aria-label={text}
    >
      {display}
    </span>
  )
}
