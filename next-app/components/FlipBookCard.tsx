'use client'

import Image from 'next/image'
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

export default function FlipBookCard() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [flipped, setFlipped] = useState(false)

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = stageRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))

    node.style.setProperty('--book-x', `${((0.5 - py) * 10).toFixed(2)}deg`)
    node.style.setProperty('--book-y', `${((px - 0.5) * 14).toFixed(2)}deg`)
    node.style.setProperty('--book-shine-x', `${(px * 100).toFixed(1)}%`)
    node.style.setProperty('--book-shine-y', `${(py * 100).toFixed(1)}%`)
  }

  const handleLeave = () => {
    const node = stageRef.current
    if (!node) return
    node.style.setProperty('--book-x', '0deg')
    node.style.setProperty('--book-y', '0deg')
  }

  const toggle = () => setFlipped((value) => !value)

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle()
    }
  }

  return (
    <div className="book-stage" ref={stageRef} onPointerMove={handleMove} onPointerLeave={handleLeave}>
      <div
        className={`flip-book ${flipped ? 'is-flipped' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={flipped ? 'Close the McPherson campus book' : 'Turn the McPherson campus book page'}
        aria-pressed={flipped}
        onClick={toggle}
        onKeyDown={handleKey}
      >
        <div className="book-edge book-edge-one" aria-hidden="true" />
        <div className="book-edge book-edge-two" aria-hidden="true" />

        <div className="book-face book-front">
          <div className="book-glare" aria-hidden="true" />
          <div className="book-topline">
            <span>McPherson University</span>
            <span>01 / 03</span>
          </div>
          <div className="book-seal">
            <Image src="/mcu-logo.png" alt="" width={48} height={48} />
          </div>
          <div className="book-title">
            <span>Campus</span>
            <strong>Pass</strong>
          </div>
          <div className="book-meta">
            <span>Verified academic day</span>
            <span>2026</span>
          </div>
          <div className="book-chip" aria-hidden="true">
            <i />
            <i />
          </div>
        </div>

        <div className="book-face book-back">
          <div className="book-glare" aria-hidden="true" />
          <span className="book-kicker">Chapter two</span>
          <h3>One verified path.</h3>
          <p>Timecode, location and enrolment agree before a session is confirmed.</p>
          <div className="book-stamp" aria-hidden="true">
            MCU
          </div>
          <span className="book-hint">Click or press to close</span>
        </div>
      </div>

      <button type="button" className="book-control" onClick={toggle} aria-label={flipped ? 'Close book cover' : 'Turn book page'}>
        {flipped ? 'Close cover' : 'Turn the page'}
        <span aria-hidden="true">{flipped ? '↩' : '→'}</span>
      </button>
    </div>
  )
}
