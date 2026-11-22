import Image from 'next/image'
import Link from 'next/link'
import styles from './landing.module.css'

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M4.5 10h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FeatureIcon({ kind }: { kind: 'courses' | 'attendance' | 'study' }) {
  const paths = {
    courses: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H18v14H6.5A2.5 2.5 0 0 0 4 19.5v-14Z" /><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H18M8 7h6M8 10h7" /></>,
    attendance: <><path d="M10 18s6-3.5 6-8V5l-6-2-6 2v5c0 4.5 6 8 6 8Z" /><path d="m7.5 10 1.7 1.7 3.6-3.6" /></>,
    study: <><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H10v14H5.5A2.5 2.5 0 0 0 3 19.5v-14Z" /><path d="M17 5.5A2.5 2.5 0 0 0 14.5 3H10v14h4.5a2.5 2.5 0 0 1 2.5 2.5v-14Z" /></>,
  }

  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">{paths[kind]}</svg>
}

const features = [
  {
    kind: 'courses' as const,
    label: 'COURSES & TIMETABLE',
    title: 'Know what is next',
    description: 'Keep your courses, class times and campus notices together in one useful view.',
  },
  {
    kind: 'attendance' as const,
    label: 'VERIFIED ATTENDANCE',
    title: 'Check in with confidence',
    description: 'See when a class session is open and review your attendance history afterward.',
  },
  {
    kind: 'study' as const,
    label: 'STUDY SUPPORT',
    title: 'Keep learning moving',
    description: 'Find course materials, study plans, quizzes and study tools in one workspace.',
  },
]

export default function LandingExperience() {
  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#main-content">Skip to content</a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="McPherson University home">
          <span className={styles.brandMark}>
            <Image src="/mcu-logo.png" alt="" width={42} height={42} priority />
          </span>
          <span className={styles.brandText}>
            <strong>McPherson University</strong>
            <small>Citadel of Champions</small>
          </span>
        </Link>
        <nav className={styles.nav} aria-label="Page sections">
          <a href="#features">Student tools</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className={styles.accountActions}>
          <Link href="/login" className={styles.signIn}>Sign in</Link>
          <Link href="/signup" className={styles.accountButton}>Create account <ArrowIcon /></Link>
        </div>
      </header>

      <section className={styles.hero} id="main-content" aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> THE MCPHERSON STUDENT PORTAL</p>
          <h1 id="hero-title">Your campus day,<br /><em>in focus.</em></h1>
          <p className={styles.heroSummary}>Courses, class times, verified attendance and study support, together in one clear place.</p>
          <div className={styles.heroActions}>
            <Link href="/login" className={styles.primaryButton}>Enter your portal <ArrowIcon /></Link>
            <a href="#features" className={styles.textButton}>Explore student tools <span aria-hidden="true">↓</span></a>
          </div>
          <div className={styles.trustNote}>
            <span className={styles.trustIcon} aria-hidden="true">✓</span>
            <span><strong>University account access</strong><small>Sign in with your registered McPherson account.</small></span>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <Image className={styles.campusImage} src="/mcu-campus.jpg" alt="Green campus grounds and buildings at McPherson University" fill priority sizes="(max-width: 760px) 100vw, 52vw" />
          <div className={styles.imageWash} aria-hidden="true" />
          <div className={styles.campusTag}><span /> MCPHERSON UNIVERSITY</div>
          <div className={styles.portalPreview} aria-label="Illustration of student portal tools">
            <div className={styles.previewTop}>
              <span className={styles.previewMark}>M</span>
              <span><strong>Student portal</strong><small>Your academic workspace</small></span>
              <span className={styles.previewCap} aria-hidden="true">✦</span>
            </div>
            <p className={styles.previewGreeting}>Your academic day</p>
            <div className={styles.previewTiles}>
              <div><small>COURSES</small><strong>Course list</strong></div>
              <div><small>TIMETABLE</small><strong>Class schedule</strong></div>
            </div>
            <div className={styles.previewStudy}><small>STUDENT TOOLS</small><strong>Attendance and study support</strong><span>Open the tools available to your account.</span></div>
            <div className={styles.previewFooter}><span>One place to start</span><span>Explore the portal <ArrowIcon /></span></div>
          </div>
          <div className={`${styles.visualChip} ${styles.visualChipTop}`}><FeatureIcon kind="courses" /> Courses &amp; timetable</div>
          <div className={`${styles.visualChip} ${styles.visualChipBottom}`}><FeatureIcon kind="attendance" /> Verified class check-in</div>
        </div>
      </section>

      <section className={styles.features} id="features" aria-labelledby="features-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>BUILT AROUND YOUR ACADEMIC DAY</p>
          <h2 id="features-title">The essentials, closer together.</h2>
          <p>Spend less time searching for the next step and more time moving through your day.</p>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature, index) => (
            <article className={styles.featureCard} key={feature.title}>
              <div className={styles.featureCardTop}>
                <span className={`${styles.featureIcon} ${styles[`featureIcon_${feature.kind}`]}`}><FeatureIcon kind={feature.kind} /></span>
                <span className={styles.featureIndex}>0{index + 1}</span>
              </div>
              <p className={styles.featureLabel}>{feature.label}</p>
              <h3>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.steps} id="how-it-works" aria-labelledby="steps-title">
        <div className={styles.stepsIntro}>
          <p className={styles.eyebrow}>ONE SIMPLE PLACE TO START</p>
          <h2 id="steps-title">From sign-in to study session.</h2>
          <p>Your portal brings the next useful action closer, whether you are heading to class or opening your notes.</p>
          <Link href="/login" className={styles.stepsLink}>Go to your portal <ArrowIcon /></Link>
        </div>
        <ol className={styles.stepsList}>
          <li><span>01</span><div><strong>Sign in</strong><small>Use your registered university account.</small></div></li>
          <li><span>02</span><div><strong>Find your day</strong><small>Check your courses, timetable and class notices.</small></div></li>
          <li><span>03</span><div><strong>Keep your rhythm</strong><small>Check into class and continue your study plan.</small></div></li>
        </ol>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <div><p className={styles.eyebrow}>YOUR CAMPUS, CONNECTED</p><h2 id="closing-title">Ready for your academic day?</h2></div>
        <Link href="/login" className={styles.lightButton}>Enter your portal <ArrowIcon /></Link>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerBrand}>McPherson University <span>|</span> Citadel of Champions</Link>
        <div><Link href="/login">Account access</Link><Link href="/forgot-password">Sign-in help</Link></div>
      </footer>
    </main>
  )
}
