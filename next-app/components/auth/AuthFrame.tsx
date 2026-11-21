import Link from 'next/link'
import ShimmerImage from '@/components/ShimmerImage'
import type { ReactNode } from 'react'
import { UNIVERSITY } from '@/lib/config'

interface AuthFrameProps {
  eyebrow: string
  title: string
  description?: string
  badge?: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthFrame({ eyebrow, title, description, badge, children, footer }: AuthFrameProps) {
  return (
    <main className="min-h-screen bg-paper text-navy">
      <div className="grid min-h-screen lg:grid-cols-[45fr_55fr]">
        <section className="relative hidden min-h-screen overflow-hidden bg-navy text-white lg:block" aria-label="McPherson University portal">
          <ShimmerImage
            src="/mcu-campus.jpg"
            alt=""
            fill
            priority
            sizes="45vw"
            className="object-cover opacity-40"
            tone="dark"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/40 to-navy/95" />
          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
            <Link href="/welcome" className="flex items-center gap-3" aria-label="McPherson University home">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10">
                <ShimmerImage src="/mcu-logo.png" alt="" width={38} height={38} />
              </span>
              <span className="leading-tight">
                <strong className="block text-base">{UNIVERSITY.name}</strong>
                <small className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-coral">{UNIVERSITY.tagline}</small>
              </span>
            </Link>

            <div className="max-w-lg">
              {badge ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-coral">
                  {badge}
                </span>
              ) : null}
              <h1 className="mt-6 text-4xl font-bold leading-tight xl:text-5xl">
                Your campus.<br />
                <em className="not-italic text-coral">In one place.</em>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-white/75">
                Attendance, courses and study tools — brought together in one clear university workspace.
              </p>
              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                {[
                  ['Verified sign-in', 'One secure university account'],
                  ['Academic day', 'Courses, classes and timetable'],
                  ['Study workspace', 'Notes, quizzes and resources'],
                ].map(([heading, detail]) => (
                  <div key={heading} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                    <strong className="block text-sm">{heading}</strong>
                    <span className="mt-1 block text-xs text-white/65">{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
              Seriki Sotayo · Ogun State · © {new Date().getFullYear()} MCU
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F6F8FC]">
                <ShimmerImage src="/mcu-logo.png" alt="" width={36} height={36} />
              </span>
              <span className="leading-tight">
                <strong className="block text-sm">{UNIVERSITY.name}</strong>
                <small className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-blue">{UNIVERSITY.tagline}</small>
              </span>
            </div>

            <div className="mb-8 flex items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-[#F6F8FC] px-4 py-3">
              <div className="leading-tight">
                <strong className="block text-sm">{UNIVERSITY.name}</strong>
                <small className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-navy/50">
                  {UNIVERSITY.shortCode} · Official university portal
                </small>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-blue">
                <i className="h-1.5 w-1.5 rounded-full bg-blue" aria-hidden="true" /> Live
              </span>
            </div>

            <header className="mb-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue">{eyebrow}</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
              {description ? <p className="mt-3 text-sm leading-relaxed text-navy/60">{description}</p> : null}
            </header>

            {children}

            {footer ? <div className="mt-7 text-center text-sm text-navy/60">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  )
}
