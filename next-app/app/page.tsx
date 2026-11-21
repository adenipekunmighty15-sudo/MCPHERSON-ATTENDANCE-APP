import Image from 'next/image'
import InteractiveHero from '@/components/InteractiveHero'
import MagneticLink from '@/components/MagneticLink'
import Reveal from '@/components/Reveal'
import ScrollSequence from '@/components/ScrollSequence'

const signInUrl = '/login'

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-paper text-navy">
      <header className="sticky top-0 z-40 border-b border-navy/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="McPherson University home">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-[#F6F8FC]">
              <Image src="/mcu-logo.png" alt="" width={40} height={40} priority />
            </span>
            <span className="leading-tight">
              <strong className="block text-sm sm:text-base">McPherson University</strong>
              <small className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-blue">Citadel of Champions</small>
            </span>
          </a>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary">
            <a href="#story" className="hidden text-sm font-medium text-navy/65 transition-colors hover:text-navy sm:inline">
              The story
            </a>
            <MagneticLink href={signInUrl} className="mcu-action mcu-action--secondary !min-h-[40px] !px-4" strength={0.14}>
              Sign in
            </MagneticLink>
          </nav>
        </div>
      </header>

      <InteractiveHero />
      <ScrollSequence />

      <section className="bg-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 sm:py-20 md:flex-row md:items-center">
          <Reveal>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-coral">Ready when you are</span>
            <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">Step into the McPherson portal.</h2>
          </Reveal>
          <Reveal delay={100}>
            <MagneticLink href={signInUrl} className="mcu-action mcu-action--primary" strength={0.2}>
              Sign in securely
              <span aria-hidden="true">→</span>
            </MagneticLink>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-navy/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-navy/50 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} McPherson University. Official campus portal experience.</p>
          <p>Built with Next.js, TypeScript, Tailwind CSS and Lenis.</p>
        </div>
      </footer>
    </main>
  )
}
