import type { Metadata } from 'next'
import Link from 'next/link'
import AuthGuard from '@/components/auth/AuthGuard'
import CampusShowcase from '@/components/CampusShowcase'
import PortalNav from '@/components/portal/PortalNav'
import ShimmerImage from '@/components/ShimmerImage'
import styles from './university.module.css'

export const metadata: Metadata = {
  title: 'University | McPherson University Portal',
  description: 'Explore McPherson University, the Citadel of Champions, from inside your campus portal.',
}

const highlights = [
  { icon: '⌖', title: 'Verified attendance', copy: 'Live class code, device location and enrolment agree before a session is confirmed.' },
  { icon: '▣', title: 'One academic day', copy: 'Timetable, courses, next session and course standing stay together in the portal.' },
  { icon: '✦', title: 'AI study desk', copy: 'A full model court compares real answers and helps you study with verified support.' },
]

export default function UniversityPage() {
  return (
    <AuthGuard>
      <PortalNav active="university" />
      <main className={styles.page}>
        <section className={styles.hero}>
          <ShimmerImage
            src="/mcu-campus.jpg"
            alt="McPherson University campus"
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
            tone="dark"
          />
          <span className={styles.heroOverlay} aria-hidden="true" />
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>McPherson University · Citadel of Champions</p>
            <h1>The university behind your portal.</h1>
            <p className={styles.lead}>
              A calibrated view of campus life, academic rhythm and the place your attendance record belongs — all inside
              the same app you use to study.
            </p>
            <div className={styles.heroActions}>
              <Link href="/chat" className={styles.primaryAction}>Ask the AI court <span>→</span></Link>
              <Link href="/dashboard" className={styles.secondaryAction}>Back to overview</Link>
            </div>
          </div>
        </section>

        <section className={styles.highlights} aria-label="University highlights">
          {highlights.map((item) => (
            <article key={item.title} className={styles.highlightCard}>
              <span className={styles.highlightIcon} aria-hidden="true">{item.icon}</span>
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
            </article>
          ))}
        </section>

        <CampusShowcase />

        <section className={styles.closing}>
          <div>
            <p className={styles.kicker}>Still inside the app</p>
            <h2>Move from campus to study without changing tabs.</h2>
            <p>
              The University, Overview and AI Chat sections share one navigation and one signed-in session. Pick the next
              step below.
            </p>
          </div>
          <div className={styles.closingActions}>
            <Link href="/chat" className={styles.primaryAction}>Open AI chat →</Link>
            <Link href="/dashboard" className={styles.secondaryAction}>Return to dashboard</Link>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
