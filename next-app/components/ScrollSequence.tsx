'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

const chapters = [
  {
    number: '01',
    kicker: 'Arrive',
    title: 'Find your place on campus.',
    copy: 'Today’s timetable, courses and next session sit together. No guessing, no scattered tabs — just the academic day in front of you.',
  },
  {
    number: '02',
    kicker: 'Verify',
    title: 'Confirm attendance with proof.',
    copy: 'A rotating class code, device GPS and an active enrolment are checked on the server before a record is accepted.',
  },
  {
    number: '03',
    kicker: 'Continue',
    title: 'See the full picture.',
    copy: 'History, course standing and next steps stay close, so one confirmed session becomes part of a clear Academic story.',
  },
]

export default function ScrollSequence() {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const node = sectionRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const travel = Math.max(1, rect.height - window.innerHeight)
      const next = Math.min(1, Math.max(0, -rect.top / travel))
      setProgress(next)
      setActive(Math.min(chapters.length - 1, Math.floor(next * chapters.length)))
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

  const jumpTo = (index: number) => {
    const node = sectionRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const travel = Math.max(1, rect.height - window.innerHeight)
    const target = rect.top + window.scrollY + travel * ((index + 0.5) / chapters.length)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <section
      ref={sectionRef}
      id="story"
      className="sequence-shell"
      style={{ '--sequence-progress': progress.toFixed(3) } as CSSProperties}
      aria-label="McPherson portal story"
    >
      <div className="sequence-sticky">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-5 py-14 sm:px-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue">The portal story</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">One academic day, in three moves.</h2>
            </div>
            <div className="sequence-counter" aria-live="polite">
              <strong>{String(active + 1).padStart(2, '0')}</strong>
              <span>/ {String(chapters.length).padStart(2, '0')}</span>
            </div>
          </div>

          <div className="sequence-progress" aria-hidden="true">
            <span style={{ width: `${(progress * 100).toFixed(2)}%` }} />
          </div>

          <div className="sequence-stage">
            <div className="sequence-object" aria-hidden="true">
              <div className="sequence-object-ring" />
              <div className="sequence-object-core" />
            </div>

            {chapters.map((chapter, index) => (
              <article
                key={chapter.number}
                className={`sequence-panel ${index === active ? 'is-active' : ''}`}
                aria-hidden={index !== active}
              >
                <span className="sequence-number">{chapter.number}</span>
                <span className="sequence-kicker">{chapter.kicker}</span>
                <h3>{chapter.title}</h3>
                <p>{chapter.copy}</p>
              </article>
            ))}
          </div>

          <nav className="sequence-index" aria-label="Story chapters">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.number}
                type="button"
                className={index === active ? 'is-active' : ''}
                onClick={() => jumpTo(index)}
                aria-current={index === active ? 'step' : undefined}
              >
                <span>{chapter.number}</span>
                {chapter.kicker}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}
