'use client'

import Image from 'next/image'
import { useRef, type PointerEvent } from 'react'
import FlipBookCard from './FlipBookCard'
import MagneticLink from './MagneticLink'
import Reveal from './Reveal'
import ScrambleText from './ScrambleText'

export default function InteractiveHero() {
  const heroRef = useRef<HTMLElement>(null)

  const handleMove = (event: PointerEvent<HTMLElement>) => {
    const node = heroRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    node.style.setProperty('--hero-x', `${((px - 0.5) * -18).toFixed(2)}px`)
    node.style.setProperty('--hero-y', `${((py - 0.5) * -12).toFixed(2)}px`)
  }

  const handleLeave = () => {
    const node = heroRef.current
    if (!node) return
    node.style.setProperty('--hero-x', '0px')
    node.style.setProperty('--hero-y', '0px')
  }

  return (
    <section
      ref={heroRef}
      className="interactive-hero"
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <Image
        src="/mcu-campus.jpg"
        alt="McPherson University campus"
        fill
        priority
        sizes="100vw"
        className="hero-campus"
      />
      <div className="hero-wash" aria-hidden="true" />
      <div className="hero-halo" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-32">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" />
            The McPherson campus portal
          </span>
          <h1 className="mt-7 text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            Your campus.
            <br />
            <ScrambleText text="In one rhythm." className="text-coral" />
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Attendance, courses and daily direction for one university — designed to feel precise, calm and unmistakably McPherson.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <MagneticLink href="/login" className="mcu-action mcu-action--primary" strength={0.2}>
              Enter your portal
              <span aria-hidden="true">→</span>
            </MagneticLink>
            <MagneticLink href="#story" className="mcu-action mcu-action--secondary" strength={0.14}>
              Follow the story
            </MagneticLink>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <FlipBookCard />
        </Reveal>
      </div>
    </section>
  )
}
