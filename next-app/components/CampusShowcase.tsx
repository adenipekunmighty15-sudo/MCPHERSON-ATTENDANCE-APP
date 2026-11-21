'use client'

import { useRef, useState, type PointerEvent } from 'react'
import ShimmerImage from './ShimmerImage'

const spots = [
  {
    id: 'arrival',
    x: 24,
    y: 64,
    icon: '⌖',
    title: 'Arrival & verification',
    copy: 'Check in with a live class code and device location. Attendance is confirmed on the server, not assumed.',
  },
  {
    id: 'halls',
    x: 58,
    y: 32,
    icon: '▣',
    title: 'Lecture halls',
    copy: 'Today’s timetable, the next session and your course standing stay together in one calm academic day.',
  },
  {
    id: 'study',
    x: 78,
    y: 58,
    icon: '◇',
    title: 'Study spaces',
    copy: 'Turn notes into flashcards, quizzes and focused sessions with AI tools built around your courses.',
  },
] as const

export default function CampusShowcase() {
  const frameRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = frameRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    node.style.setProperty('--campus-x', `${((px - 0.5) * -16).toFixed(2)}px`)
    node.style.setProperty('--campus-y', `${((py - 0.5) * -10).toFixed(2)}px`)
    node.style.setProperty('--campus-glow-x', `${(px * 100).toFixed(1)}%`)
    node.style.setProperty('--campus-glow-y', `${(py * 100).toFixed(1)}%`)
  }

  const handleLeave = () => {
    const node = frameRef.current
    if (!node) return
    node.style.setProperty('--campus-x', '0px')
    node.style.setProperty('--campus-y', '0px')
  }

  const move = (direction: number) => {
    setActive((current) => (current + direction + spots.length) % spots.length)
  }

  const current = spots[active]

  return (
    <section className="campus-showcase" id="campus" aria-label="Explore McPherson University campus">
      <div className="campus-grid">
        <div className="campus-copy">
          <span className="campus-kicker">The campus, up close</span>
          <h2>See the place behind the portal.</h2>
          <p>
            McPherson University is more than a timetable. Explore the spaces that shape the academic day — then move
            straight into the portal built around them.
          </p>
          <div className="campus-hints" aria-hidden="true">
            <span>Move your cursor over the photo</span>
            <span>Pick a marker to explore</span>
          </div>
          <div className="campus-nav" aria-label="Campus highlights">
            <button type="button" onClick={() => move(-1)} aria-label="Previous highlight">←</button>
            <span>
              {String(active + 1).padStart(2, '0')} / {String(spots.length).padStart(2, '0')}
            </span>
            <button type="button" onClick={() => move(1)} aria-label="Next highlight">→</button>
          </div>
        </div>

        <div className="campus-frame" ref={frameRef} onPointerMove={handleMove} onPointerLeave={handleLeave}>
          <ShimmerImage
            src="/mcu-campus.jpg"
            alt="McPherson University campus buildings and grounds"
            fill
            sizes="(max-width: 900px) 100vw, 58vw"
            className="campus-image"
            tone="dark"
          />
          <span className="campus-sheen" aria-hidden="true" />
          <span className="campus-vignette" aria-hidden="true" />

          {spots.map((spot, index) => (
            <button
              key={spot.id}
              type="button"
              className={`campus-hotspot ${active === index ? 'is-active' : ''}`}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => setActive(index)}
              aria-pressed={active === index}
              aria-label={`${spot.title}: ${spot.copy}`}
            >
              <span className="campus-hotspot-dot" aria-hidden="true">{spot.icon}</span>
              <span className="campus-hotspot-label">{spot.title}</span>
            </button>
          ))}

          <div className="campus-detail" aria-live="polite">
            <span className="campus-detail-icon" aria-hidden="true">{current.icon}</span>
            <span className="campus-detail-copy">
              <strong>{current.title}</strong>
              <small>{current.copy}</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
