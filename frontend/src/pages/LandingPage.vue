<template>
  <main class="landing-page">
    <header class="site-header">
      <router-link to="/welcome" class="site-brand" aria-label="McPherson University home">
        <span class="site-brand__crest"><Logo :size="36" /></span>
        <span class="site-brand__words">
          <strong>McPherson University</strong>
          <small>Citadel of Champions</small>
        </span>
      </router-link>

      <nav class="site-nav" aria-label="Page sections">
        <a href="#features">Student tools</a>
        <a href="#how-it-works">How it works</a>
      </nav>

      <div class="site-actions">
        <router-link :to="loginLink" class="site-signin">Sign in</router-link>
        <router-link :to="signupLink" class="site-account">Create account <ArrowUpRight :size="16" aria-hidden="true" /></router-link>
      </div>
    </header>

    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow"><span aria-hidden="true"></span> THE McPHERSON STUDENT PORTAL</p>
        <h1 id="hero-title">Your campus day,<br /><em>in focus.</em></h1>
        <p class="hero-summary">Courses, class times, verified attendance and study support, together in one clear place.</p>
        <div class="hero-actions">
          <router-link :to="loginLink" class="button button--primary">Enter your portal <ArrowUpRight :size="17" aria-hidden="true" /></router-link>
          <a href="#features" class="button button--text">Explore student tools <ArrowDown :size="16" aria-hidden="true" /></a>
        </div>
        <div class="trust-note">
          <span class="trust-note__icon"><ShieldCheck :size="18" aria-hidden="true" /></span>
          <span><strong>University account access</strong><small>Sign in with your registered McPherson account.</small></span>
        </div>
      </div>

      <div class="hero-visual" aria-label="McPherson University campus and a preview of the student portal">
        <img :src="campusImage" alt="Green campus grounds and buildings at McPherson University" fetchpriority="high" />
        <div class="hero-visual__wash" aria-hidden="true"></div>
        <div class="campus-tag"><span></span> MCPHERSON UNIVERSITY</div>
        <div class="portal-preview">
          <div class="portal-preview__top">
            <span class="portal-preview__mark">M</span>
            <span><strong>Student portal</strong><small>Your academic workspace</small></span>
            <span class="portal-preview__avatar" aria-hidden="true"><GraduationCap :size="15" /></span>
          </div>
          <p class="portal-preview__greeting">Your academic day</p>
          <div class="portal-preview__stats">
            <div><small>COURSES</small><strong>Course list</strong></div>
            <div><small>TIMETABLE</small><strong>Class schedule</strong></div>
          </div>
          <div class="portal-preview__class">
            <span>STUDENT TOOLS</span>
            <strong>Attendance and study support</strong>
            <small>Open the tools available to your account.</small>
          </div>
          <div class="portal-preview__footer"><span>Today at a glance</span><span>View timetable <ArrowUpRight :size="13" aria-hidden="true" /></span></div>
        </div>
        <div class="visual-chip visual-chip--one"><BookOpenCheck :size="16" aria-hidden="true" /> Courses &amp; timetable</div>
        <div class="visual-chip visual-chip--two"><MapPinCheck :size="16" aria-hidden="true" /> Verified class check-in</div>
      </div>
    </section>

    <section class="feature-section" id="features" aria-labelledby="features-title">
      <div class="section-heading">
        <p class="eyebrow">BUILT AROUND YOUR ACADEMIC DAY</p>
        <h2 id="features-title">The essentials, closer together.</h2>
        <p>Spend less time searching for the next step and more time moving through your day.</p>
      </div>
      <div class="feature-grid">
        <article v-for="(feature, index) in features" :key="feature.title" class="feature-card">
          <div class="feature-card__top">
            <span class="feature-icon" :class="`feature-icon--${feature.tone}`"><component :is="feature.icon" :size="19" aria-hidden="true" /></span>
            <span class="feature-index">0{{ index + 1 }}</span>
          </div>
          <p class="feature-kicker">{{ feature.kicker }}</p>
          <h3>{{ feature.title }}</h3>
          <p class="feature-copy">{{ feature.copy }}</p>
        </article>
      </div>
    </section>

    <section class="steps-section" id="how-it-works" aria-labelledby="steps-title">
      <div class="steps-intro">
        <p class="eyebrow">ONE SIMPLE PLACE TO START</p>
        <h2 id="steps-title">From sign-in to study session.</h2>
        <p>Your portal brings the next useful action closer, whether you are heading to class or opening your notes.</p>
        <router-link :to="loginLink" class="steps-link">Go to your portal <ArrowUpRight :size="16" aria-hidden="true" /></router-link>
      </div>
      <ol class="steps-list">
        <li><span>01</span><div><strong>Sign in</strong><small>Use your registered university account.</small></div></li>
        <li><span>02</span><div><strong>Find your day</strong><small>Check your courses, timetable and class notices.</small></div></li>
        <li><span>03</span><div><strong>Keep your rhythm</strong><small>Check into class and continue your study plan.</small></div></li>
      </ol>
    </section>

    <section class="closing-cta" aria-labelledby="closing-title">
      <div><p class="eyebrow">YOUR CAMPUS, CONNECTED</p><h2 id="closing-title">Ready for your academic day?</h2></div>
      <router-link :to="loginLink" class="button button--light">Enter your portal <ArrowUpRight :size="17" aria-hidden="true" /></router-link>
    </section>

    <footer class="site-footer">
      <router-link to="/welcome" class="site-footer__brand">McPherson University <span>|</span> Citadel of Champions</router-link>
      <div><router-link to="/login">Account access</router-link><router-link to="/forgot-password">Sign-in help</router-link></div>
    </footer>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowDown, ArrowUpRight, BookOpenCheck, CalendarDays, GraduationCap, MapPinCheck, ShieldCheck } from 'lucide-vue-next'
import Logo from '../components/Logo.vue'
import campusImage from '../assets/mcu-campus.jpg'

const features = [
  {
    icon: CalendarDays,
    title: 'Know what is next',
    kicker: 'COURSES & TIMETABLE',
    copy: 'Keep your courses, class times and campus notices together in one useful view.',
    tone: 'forest',
  },
  {
    icon: MapPinCheck,
    title: 'Check in with confidence',
    kicker: 'VERIFIED ATTENDANCE',
    copy: 'See when a class session is open and review your attendance history afterward.',
    tone: 'clay',
  },
  {
    icon: GraduationCap,
    title: 'Keep learning moving',
    kicker: 'STUDY SUPPORT',
    copy: 'Find course materials, study plans, quizzes and AI study tools in one workspace.',
    tone: 'sage',
  },
]

const route = useRoute()
const redirectQuery = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? { redirect }
    : {}
})
const loginLink = computed(() => ({ path: '/login', query: redirectQuery.value }))
const signupLink = computed(() => ({ path: '/signup', query: redirectQuery.value }))
</script>

<style scoped>
.landing-page { --lp-bg: #f5f1e7; --lp-surface: #fffdf8; --lp-ink: #24352a; --lp-muted: #607064; --lp-forest: #3d684b; --lp-clay: #b96445; --lp-line: #e5dece; min-height: 100vh; overflow: hidden; padding-inline: clamp(20px, 6vw, 88px); background: var(--lp-bg); color: var(--lp-ink); }
.site-header { width: min(100%, 1320px); min-height: 82px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; border-bottom: 1px solid var(--lp-line); }
.site-brand { display: flex; align-items: center; gap: 11px; color: inherit; text-decoration: none; }
.site-brand__crest { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 13px; background: var(--lp-sage, #eaf0e5); color: var(--lp-forest); }
.site-brand__words { display: grid; gap: 2px; }
.site-brand__words strong { font-family: var(--font-display); font-size: 15px; font-weight: 650; letter-spacing: -.02em; }
.site-brand__words small { color: var(--lp-muted); font-size: 9px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.site-nav,.site-actions { display: flex; align-items: center; gap: clamp(14px, 2.5vw, 30px); }
.site-nav a,.site-signin { color: var(--lp-muted); font-size: 12px; font-weight: 650; text-decoration: none; }
.site-nav a:hover,.site-signin:hover { color: var(--lp-forest); }
.site-account,.button { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; gap: 9px; border-radius: 12px; padding: 0 17px; font-size: 12px; font-weight: 700; text-decoration: none; transition: transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease; }
.site-account,.button--primary { background: var(--lp-forest); color: #fff; box-shadow: 0 8px 18px rgba(61,104,75,.16); }
.site-account:hover,.button--primary:hover { transform: translateY(-1px); background: #2d523b; box-shadow: 0 10px 22px rgba(61,104,75,.2); }
.hero { width: min(100%, 1320px); min-height: 600px; margin: 0 auto; display: grid; grid-template-columns: minmax(0,.92fr) minmax(420px,1.08fr); align-items: center; gap: clamp(28px,6vw,88px); padding-block: 68px 72px; }
.hero-copy { position: relative; z-index: 2; }
.eyebrow { display: flex; align-items: center; gap: 9px; margin: 0; color: var(--lp-forest); font-size: 10px; font-weight: 800; letter-spacing: .15em; }
.eyebrow > span { width: 7px; height: 7px; border-radius: 50%; background: var(--lp-clay); box-shadow: 0 0 0 4px rgba(185,100,69,.12); }
.hero h1 { margin: 22px 0 18px; font-family: var(--font-display); font-size: clamp(56px,7vw,86px); font-weight: 600; letter-spacing: -.06em; line-height: .98; }
.hero h1 em { color: var(--lp-forest); font-weight: 500; }
.hero-summary { max-width: 520px; margin: 0; color: var(--lp-muted); font-size: clamp(15px,1.35vw,18px); line-height: 1.7; }
.hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; margin-top: 28px; }
.button--primary { min-height: 50px; padding-inline: 21px; font-size: 13px; }
.button--text { color: var(--lp-forest); padding-inline: 4px; }
.button--text:hover,.steps-link:hover { gap: 13px; }
.trust-note { display: flex; align-items: center; gap: 11px; margin-top: 34px; }
.trust-note__icon { display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid var(--lp-line); border-radius: 11px; background: var(--lp-surface); color: var(--lp-forest); }
.trust-note > span:last-child { display: grid; gap: 3px; }
.trust-note strong { font-size: 11px; }
.trust-note small { color: var(--lp-muted); font-size: 10px; }
.hero-visual { position: relative; min-height: 480px; isolation: isolate; }
.hero-visual > img { position: absolute; inset: 0 0 36px 46px; width: calc(100% - 46px); height: calc(100% - 36px); border-radius: 28px; object-fit: cover; box-shadow: 0 24px 60px rgba(36,53,42,.14); }
.hero-visual__wash { position: absolute; inset: 0 0 36px 46px; border-radius: 28px; background: linear-gradient(180deg,rgba(25,48,35,.04) 20%,rgba(25,48,35,.62) 100%); }
.campus-tag { position: absolute; top: 24px; right: 24px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,.3); border-radius: 999px; padding: 9px 12px; background: rgba(20,38,28,.48); color: #fff; font-size: 9px; font-weight: 750; letter-spacing: .11em; backdrop-filter: blur(10px); }
.campus-tag span { width: 6px; height: 6px; border-radius: 50%; background: #c9dcae; }
.portal-preview { position: absolute; right: 0; bottom: 0; width: min(400px,83%); border: 1px solid rgba(229,222,206,.9); border-radius: 20px; padding: 18px; background: var(--lp-surface); box-shadow: 0 24px 55px rgba(36,53,42,.2); }
.portal-preview__top { display: flex; align-items: center; gap: 10px; }
.portal-preview__mark { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 10px; background: var(--lp-forest); color: #fff; font-size: 16px; font-weight: 800; }
.portal-preview__top > span:nth-child(2) { display: grid; gap: 2px; }
.portal-preview__top strong { font-size: 11px; }
.portal-preview__top small { color: var(--lp-muted); font-size: 9px; }
.portal-preview__avatar { display: grid; width: 31px; height: 31px; place-items: center; margin-left: auto; border-radius: 50%; background: #eaf0e5; color: var(--lp-forest); font-size: 9px; font-weight: 800; }
.portal-preview__greeting { margin: 16px 0 11px; font-family: var(--font-display); font-size: 19px; font-weight: 650; letter-spacing: -.03em; }
.portal-preview__stats { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
.portal-preview__stats > div { display: grid; gap: 5px; border-radius: 11px; padding: 10px; background: var(--lp-bg); }
.portal-preview__stats small { color: var(--lp-muted); font-size: 8px; font-weight: 800; letter-spacing: .1em; }
.portal-preview__stats strong { font-size: 17px; }
.portal-preview__stats > div:first-child strong { color: var(--lp-forest); }
.portal-preview__class { display: grid; gap: 5px; margin-top: 9px; border-radius: 12px; padding: 11px 12px; background: #eaf0e5; }
.portal-preview__class span { color: var(--lp-forest); font-size: 8px; font-weight: 800; letter-spacing: .08em; }
.portal-preview__class strong { font-size: 11px; }
.portal-preview__class small { color: var(--lp-muted); font-size: 9px; }
.portal-preview__footer { display: flex; justify-content: space-between; gap: 8px; margin-top: 12px; color: var(--lp-muted); font-size: 9px; }
.portal-preview__footer span:last-child { display: flex; align-items: center; gap: 4px; color: var(--lp-forest); font-weight: 700; }
.visual-chip { position: absolute; display: flex; align-items: center; gap: 8px; border: 1px solid var(--lp-line); border-radius: 12px; padding: 11px 13px; background: var(--lp-surface); box-shadow: 0 12px 30px rgba(36,53,42,.12); color: var(--lp-ink); font-size: 10px; font-weight: 700; }
.visual-chip svg { color: var(--lp-clay); }
.visual-chip--one { top: 96px; left: 0; }
.visual-chip--two { right: 2px; bottom: 94px; }
.feature-section,.steps-section,.site-footer { width: min(100%,1320px); margin-inline: auto; }
.feature-section { padding-block: 28px 90px; }
.section-heading { max-width: 660px; margin-bottom: 26px; }
.section-heading h2,.steps-intro h2 { margin: 12px 0 9px; font-family: var(--font-display); font-size: clamp(30px,4vw,44px); font-weight: 600; letter-spacing: -.045em; line-height: 1.08; }
.section-heading > p:last-child,.steps-intro > p:not(.eyebrow) { max-width: 560px; margin: 0; color: var(--lp-muted); font-size: 14px; line-height: 1.7; }
.feature-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 14px; }
.feature-card { min-height: 230px; border: 1px solid var(--lp-line); border-radius: 18px; padding: 22px; background: var(--lp-surface); box-shadow: 0 2px 8px rgba(36,53,42,.025); transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.feature-card:hover { transform: translateY(-3px); border-color: rgba(61,104,75,.28); box-shadow: 0 14px 32px rgba(36,53,42,.08); }
.feature-card__top { display: flex; align-items: center; justify-content: space-between; }
.feature-icon { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 12px; }
.feature-icon--forest { background: #eaf0e5; color: var(--lp-forest); }
.feature-icon--clay { background: #f5e8df; color: #9f5037; }
.feature-icon--sage { background: #e8ede0; color: #65754c; }
.feature-index { color: #929b8e; font: 600 12px var(--font-mono); }
.feature-kicker { margin: 20px 0 7px; color: var(--lp-forest); font-size: 9px; font-weight: 800; letter-spacing: .12em; }
.feature-card h3 { margin: 0 0 8px; font-family: var(--font-display); font-size: 19px; font-weight: 600; letter-spacing: -.02em; }
.feature-copy { max-width: 340px; margin: 0; color: var(--lp-muted); font-size: 12px; line-height: 1.65; }
.steps-section { display: grid; grid-template-columns: .9fr 1.1fr; gap: 60px; align-items: center; border-top: 1px solid var(--lp-line); padding-block: 62px 74px; }
.steps-link { display: inline-flex; align-items: center; gap: 7px; margin-top: 22px; color: var(--lp-forest); font-size: 12px; font-weight: 750; text-decoration: none; transition: gap 160ms ease; }
.steps-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.steps-list li { display: flex; align-items: center; gap: 16px; border: 1px solid var(--lp-line); border-radius: 15px; padding: 16px; background: var(--lp-surface); }
.steps-list li > span { display: grid; width: 38px; height: 38px; flex: 0 0 38px; place-items: center; border-radius: 50%; background: var(--lp-sage, #eaf0e5); color: var(--lp-forest); font: 700 11px var(--font-mono); }
.steps-list li div { display: grid; gap: 4px; }
.steps-list strong { font-size: 13px; }
.steps-list small { color: var(--lp-muted); font-size: 11px; }
.closing-cta { width: min(100%,1320px); margin: 0 auto 40px; display: flex; align-items: center; justify-content: space-between; gap: 24px; border-radius: 22px; padding: 34px 40px; background: #24352a; color: white; }
.closing-cta .eyebrow { color: #c9dcae; }
.closing-cta h2 { margin: 10px 0 0; font-family: var(--font-display); font-size: clamp(24px,3vw,34px); font-weight: 600; letter-spacing: -.035em; }
.button--light { flex: 0 0 auto; min-height: 48px; padding-inline: 20px; background: #a7c18b; color: #1d2c23; }
.button--light:hover { transform: translateY(-1px); background: #bdd49f; }
.site-footer { min-height: 66px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-top: 1px solid var(--lp-line); color: var(--lp-muted); font-size: 10px; }
.site-footer a { color: inherit; text-decoration: none; }
.site-footer a:hover { color: var(--lp-forest); }
.site-footer__brand { font-weight: 650; }
.site-footer__brand span { padding-inline: 4px; color: var(--lp-clay); }
.site-footer > div { display: flex; gap: 18px; }
@media (max-width: 900px) { .landing-page { padding-inline: 28px; } .site-nav { display: none; } .hero { min-height: 0; grid-template-columns: 1fr 1fr; gap: 24px; padding-block: 54px 62px; } .hero h1 { font-size: clamp(50px,7vw,70px); } .hero-visual { min-height: 430px; } .portal-preview { width: min(390px,94%); } .visual-chip--two { bottom: 84px; } .steps-section { gap: 32px; } }
@media (max-width: 640px) { .landing-page { padding-inline: 18px; } .site-header { min-height: 70px; gap: 10px; } .site-brand { gap: 8px; } .site-brand__crest { width: 36px; height: 36px; } .site-brand__crest :deep(svg) { width: 30px; height: 30px; } .site-brand__words strong { font-size: 11px; } .site-brand__words small { font-size: 7px; } .site-actions { gap: 10px; } .site-signin { font-size: 11px; } .site-account { min-height: 38px; gap: 5px; padding-inline: 9px; font-size: 10px; } .site-account svg { width: 13px; } .hero { grid-template-columns: 1fr; gap: 18px; padding-block: 46px 48px; } .hero h1 { margin-top: 18px; font-size: clamp(48px,13vw,66px); } .hero-summary { max-width: 440px; font-size: 15px; } .hero-actions { gap: 10px 16px; } .button--text { min-height: 42px; font-size: 11px; } .trust-note { margin-top: 24px; } .hero-visual { min-height: 350px; margin-top: 6px; } .hero-visual > img,.hero-visual__wash { inset: 0 0 26px 20px; width: calc(100% - 20px); height: calc(100% - 26px); border-radius: 22px; } .campus-tag { top: 13px; right: 12px; padding: 7px 9px; font-size: 7px; } .portal-preview { right: 0; bottom: 0; width: min(330px,88%); padding: 13px; border-radius: 16px; } .portal-preview__greeting { margin: 12px 0 8px; font-size: 16px; } .portal-preview__class { padding: 9px; } .visual-chip { padding: 9px 10px; font-size: 8px; } .visual-chip--one { top: 42px; left: 0; } .visual-chip--two { right: 0; bottom: 76px; } .feature-section { padding-block: 20px 56px; } .section-heading { margin-bottom: 19px; } .section-heading h2,.steps-intro h2 { font-size: 31px; } .section-heading > p:last-child,.steps-intro > p:not(.eyebrow) { font-size: 13px; } .feature-grid { grid-template-columns: 1fr; gap: 9px; } .feature-card { min-height: 0; padding: 16px; } .feature-card__top { float: left; margin-right: 14px; } .feature-card__top .feature-index { display: none; } .feature-card__top + .feature-kicker { padding-top: 3px; } .feature-kicker { margin: 0 0 4px; } .feature-card h3 { margin-bottom: 4px; font-size: 16px; } .feature-copy { margin-left: 54px; font-size: 11px; } .steps-section { grid-template-columns: 1fr; gap: 24px; padding-block: 40px 48px; } .steps-list li { gap: 12px; padding: 13px; } .closing-cta { align-items: flex-start; flex-direction: column; gap: 20px; margin-bottom: 28px; padding: 24px; border-radius: 18px; } .closing-cta h2 { font-size: 25px; } .site-footer { align-items: flex-start; flex-direction: column; justify-content: center; padding-block: 16px; } }
@media (prefers-reduced-motion: reduce) { .site-account,.button,.feature-card,.steps-link { transition: none; } }
</style>
