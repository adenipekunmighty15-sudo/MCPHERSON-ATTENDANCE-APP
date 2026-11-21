import type { Metadata } from 'next'
import Link from 'next/link'
import AuthGuard from '@/components/auth/AuthGuard'
import PortalNav from '@/components/portal/PortalNav'
import ShimmerImage from '@/components/ShimmerImage'
import styles from './dashboard.module.css'

export const metadata: Metadata = {
  title: 'Overview | McPherson University Portal',
  description: 'Your McPherson University workspace: AI study, campus information and attendance tools in one app.',
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <PortalNav active="overview" />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>McPherson University · Student portal</p>
            <h1>One app for your academic day.</h1>
            <p className={styles.lead}>
              Your portal, the university campus and the AI study desk now live together. Move between them without
              leaving the app — everything is scoped to your McPherson account.
            </p>
            <div className={styles.heroActions}>
              <Link href="/chat" className={styles.primaryAction}>Open AI courtroom <span>→</span></Link>
              <Link href="/university" className={styles.secondaryAction}>Explore the university</Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <ShimmerImage
              src="/mcu-campus.jpg"
              alt="McPherson University campus"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 45vw"
              className={styles.heroImage}
              tone="dark"
            />
            <span className={styles.heroGlow} aria-hidden="true" />
            <div className={styles.heroBadge}>
              <span>Citadel of Champions</span>
              <strong>McPherson University</strong>
            </div>
          </div>
        </section>

        <section className={styles.features} aria-label="Portal sections">
          <Link href="/chat" className={styles.featureCard}>
            <span className={`${styles.featureIcon} ${styles.aiIcon}`}>✦</span>
            <span className={styles.featureKicker}>Study desk</span>
            <strong>AI Chat &amp; Court</strong>
            <span className={styles.featureCopy}>
              Ask one question and a full bench of real models compares answers, cross-examines them and delivers a verdict.
            </span>
            <span className={styles.featureArrow}>Open AI chat →</span>
          </Link>

          <Link href="/university" className={styles.featureCard}>
            <span className={`${styles.featureIcon} ${styles.campusIcon}`}>⌖</span>
            <span className={styles.featureKicker}>Campus hub</span>
            <strong>University</strong>
            <span className={styles.featureCopy}>
              See the campus, explore the story and understand the place behind the portal — inside the same app.
            </span>
            <span className={styles.featureArrow}>Open university →</span>
          </Link>

          <div className={`${styles.featureCard} ${styles.comingSoon}`} aria-disabled="true">
            <span className={`${styles.featureIcon} ${styles.portalIcon}`}>▣</span>
            <span className={styles.featureKicker}>Academic workspace</span>
            <strong>Attendance &amp; courses</strong>
            <span className={styles.featureCopy}>
              Timetable, live verification, course standing and study materials are being migrated into this workspace.
            </span>
            <span className={styles.featureArrow}>Opening next</span>
          </div>
        </section>

        <section className={styles.note}>
          <span aria-hidden="true">✓</span>
          <p>
            You are signed in. The legacy portal stays available during the migration, but these three sections now
            share one navigation, one session and one McPherson account.
          </p>
        </section>
      </main>
    </AuthGuard>
  )
}
