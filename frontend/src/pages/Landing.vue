<template>
  <main class="landing-page">
    <header class="landing-header">
      <router-link to="/welcome" class="landing-brand" aria-label="McPherson University home">
        <span class="brand-crest" aria-hidden="true">
          <Logo :size="44" />
        </span>
        <span class="brand-wordmark">
          <strong>McPherson University</strong>
          <small>Citadel of Champions</small>
        </span>
      </router-link>
      <nav class="landing-actions" aria-label="Account">
        <a href="#portal-guide" class="landing-explore">Explore portal</a>
        <router-link :to="loginLink" class="landing-signin">Sign in</router-link>
        <router-link :to="signupLink" class="landing-create">Create account <ArrowUpRight :size="16" /></router-link>
      </nav>
    </header>

    <section class="landing-hero">
      <div class="landing-copy">
        <span class="landing-eyebrow"><span></span>THE McPHERSON UNIVERSITY PORTAL</span>
        <h1>Your campus.<br /><em>In one place.</em></h1>
        <p class="landing-intro">
          A clearer way to stay connected to classes, attendance, study tools and the people who make campus life matter.
        </p>
        <div class="landing-cta-row">
          <router-link :to="loginLink" class="landing-primary">Enter your portal <ArrowUpRight :size="18" /></router-link>
          <router-link to="/forgot-password" class="landing-secondary">Need help signing in?</router-link>
        </div>
        <div class="landing-trust">
          <span class="trust-mark"><ShieldCheck :size="17" /></span>
          <span><strong>University account access</strong><small>Sign in with your registered McPherson account</small></span>
        </div>
      </div>

      <div class="landing-art" aria-hidden="true">
        <div class="art-glow"></div>
        <div class="art-orbit orbit-one"></div>
        <div class="art-orbit orbit-two"></div>
        <div class="art-crest">
          <Logo :size="210" class="art-crest-logo" />
        </div>
        <div class="art-caption"><span></span> SERIKI SOTAYO, OGUN STATE</div>
        <div class="art-pill pill-top"><BookOpenCheck :size="15" /> Courses & timetable</div>
        <div class="art-pill pill-bottom"><MapPinned :size="15" /> Campus attendance</div>
      </div>
    </section>

    <section class="campus-pulse" aria-label="Campus at a glance">
      <article class="pulse-item">
        <strong>01</strong>
        <span><b>Verified check-in</b><small>GPS and class-code attendance</small></span>
      </article>
      <article class="pulse-item">
        <strong>02</strong>
        <span><b>One academic day</b><small>Courses, timetable and notices</small></span>
      </article>
      <article class="pulse-item">
        <strong>03</strong>
        <span><b>Study support</b><small>Notes, quizzes and AI tools</small></span>
      </article>
    </section>

    <section id="portal-guide" class="landing-features" aria-label="Portal features">
      <article class="feature-card">
        <span class="feature-icon feature-blue"><MapPinned :size="19" /></span>
        <h2>Show up with confidence</h2>
        <p>Access attendance sessions and your check-in history from one campus portal.</p>
      </article>
      <article class="feature-card">
        <span class="feature-icon feature-gold"><CalendarDays :size="19" /></span>
        <h2>Stay in sync</h2>
        <p>Keep your courses, class schedule and campus conversations close at hand.</p>
      </article>
      <article class="feature-card">
        <span class="feature-icon feature-green"><GraduationCap :size="20" /></span>
        <h2>Make study time count</h2>
        <p>Find study tools and learning resources in your academic workspace.</p>
      </article>
    </section>

    <footer class="landing-footer">
      <span>McPherson University <span aria-hidden="true">·</span> Citadel of Champions</span>
      <router-link to="/login">Account access</router-link>
    </footer>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowUpRight, BookOpenCheck, CalendarDays, GraduationCap, MapPinned, ShieldCheck } from 'lucide-vue-next'
import Logo from '../components/Logo.vue'

const route = useRoute()
const redirectQuery = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? { redirect }
    : {}
})
const loginLink = computed(() => ({ path: '/login', query: redirectQuery.value }))
// Route and inline tab state stay in sync: /signup always opens Create Account.
const signupLink = computed(() => ({ path: '/signup', query: redirectQuery.value }))
</script>

<style scoped>
.landing-page {
  min-height: 100dvh;
  overflow: hidden;
  padding: 0 clamp(20px, 6vw, 88px);
  color: #0f172a;
  background:
    radial-gradient(ellipse at 86% 22%, rgba(245, 158, 11, 0.1), transparent 28rem),
    radial-gradient(ellipse at 4% 88%, rgba(30, 58, 138, 0.06), transparent 32rem),
    #f8fafc;
}

.landing-header {
  position: relative;
  z-index: 2;
  width: min(100%, 1440px);
  min-height: 88px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
}

.landing-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.brand-crest {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: #1e3a8a;
}

.brand-wordmark {
  display: grid;
  gap: 2px;
}

.brand-wordmark strong {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.brand-wordmark small {
  color: #64748b;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.landing-actions,
.landing-cta-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

.landing-explore {
  position: relative;
  color: #334155;
  font-size: 13px;
  font-weight: 650;
  text-decoration: none;
}

.landing-explore::after {
  position: absolute;
  right: 0;
  bottom: -5px;
  left: 0;
  height: 1px;
  background: var(--color-accent, #d97706);
  content: '';
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 180ms ease;
}

.landing-explore:hover::after {
  transform: scaleX(1);
}

.landing-signin,
.landing-secondary {
  color: #334155;
  font-size: 13px;
  font-weight: 650;
  text-decoration: none;
}

.landing-signin:hover,
.landing-secondary:hover {
  color: #1e3a8a;
}

.landing-create,
.landing-primary {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 17px;
  border-radius: 12px;
  color: #fff;
  background: #1e3a8a;
  box-shadow: 0 8px 18px rgba(30, 58, 138, 0.16);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 160ms ease, background 160ms ease;
}

.landing-create:hover,
.landing-primary:hover {
  transform: translateY(-2px);
  background: #172554;
}

.landing-hero {
  position: relative;
  width: min(100%, 1320px);
  min-height: 550px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(400px, 1.05fr);
  align-items: center;
  gap: clamp(24px, 5vw, 80px);
  padding: 40px 0 28px;
}

.landing-copy {
  position: relative;
  z-index: 1;
  padding: 20px 0;
}

.landing-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.17em;
}

.landing-eyebrow span,
.art-caption span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d97706;
  box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.13);
}

.landing-copy h1 {
  margin: 24px 0 18px;
  font-family: var(--font-display);
  font-size: clamp(54px, 7vw, 92px);
  font-weight: 600;
  letter-spacing: -0.065em;
  line-height: 0.98;
}

.landing-copy h1 em {
  color: #1e3a8a;
  font-weight: 500;
}

.landing-intro {
  max-width: 520px;
  margin: 0;
  color: #475569;
  font-size: clamp(15px, 1.45vw, 18px);
  line-height: 1.7;
}

.landing-cta-row {
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 18px;
  margin-top: 30px;
}

.landing-primary {
  min-height: 50px;
  padding-inline: 21px;
  border-radius: 13px;
}

.landing-trust {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 38px;
}

.trust-mark {
  width: 35px;
  height: 35px;
  display: grid;
  place-items: center;
  border: 1px solid #dbe5f1;
  border-radius: 11px;
  color: #1e3a8a;
  background: #fff;
}

.landing-trust > span:last-child {
  display: grid;
  gap: 3px;
}

.landing-trust strong {
  color: #334155;
  font-size: 11px;
}

.landing-trust small {
  color: #64748b;
  font-size: 10px;
}

.landing-art {
  position: relative;
  min-height: 470px;
  display: grid;
  place-items: center;
  isolation: isolate;
}

.art-glow {
  position: absolute;
  width: min(78%, 430px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(30, 58, 138, 0.13), rgba(30, 58, 138, 0.04) 48%, transparent 72%);
}

.art-orbit {
  position: absolute;
  width: min(88%, 500px);
  aspect-ratio: 1;
  border: 1px solid rgba(30, 58, 138, 0.14);
  border-radius: 50%;
  transform: rotate(-24deg) scaleY(0.74);
}

.orbit-two {
  width: min(70%, 400px);
  border-color: rgba(217, 119, 6, 0.3);
  transform: rotate(38deg) scaleY(0.72);
}

.art-crest {
  position: relative;
  width: min(57%, 300px);
  aspect-ratio: 0.84;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.15);
  border-radius: 48% 48% 44% 44% / 25% 25% 58% 58%;
  background: linear-gradient(145deg, #1e3a8a, #0f172a 76%);
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.2), inset 0 0 0 9px rgba(248, 250, 252, 0.035);
  color: #f8fafc;
}

.art-crest::before {
  position: absolute;
  inset: 14px;
  border: 1px solid rgba(245, 158, 11, 0.5);
  border-radius: inherit;
  content: '';
}

.art-crest-logo {
  position: relative;
  z-index: 1;
}

.art-caption {
  position: absolute;
  bottom: 26px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.15em;
}

.art-caption span {
  width: 6px;
  height: 6px;
  box-shadow: none;
}

.art-pill {
  position: absolute;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 15px;
  border: 1px solid rgba(226, 232, 240, 0.88);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.09);
  color: #334155;
  font-size: 11px;
  font-weight: 700;
}

.art-pill svg {
  color: #d97706;
}

.pill-top {
  top: 16%;
  right: 0;
}

.pill-bottom {
  bottom: 17%;
  left: 0;
}

.campus-pulse {
  width: min(100%, 1320px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  padding-bottom: 18px;
}

.pulse-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.58);
}

.pulse-item > strong {
  color: #1e3a8a;
  font-family: var(--font-display);
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}

.pulse-item span {
  display: grid;
  gap: 2px;
}

.pulse-item b {
  color: #334155;
  font-size: 11px;
  font-weight: 700;
}

.pulse-item small {
  color: #64748b;
  font-size: 10px;
}

.landing-features {
  width: min(100%, 1320px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  padding: 18px 0 46px;
}

.feature-card {
  padding: 21px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
}

.feature-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 11px;
}

.feature-blue { color: #1e3a8a; background: rgba(30, 58, 138, 0.08); }
.feature-gold { color: #b45309; background: rgba(245, 158, 11, 0.13); }
.feature-green { color: #047857; background: rgba(16, 185, 129, 0.1); }

.feature-card h2 {
  margin: 16px 0 7px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
}

.feature-card p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.landing-footer {
  width: min(100%, 1320px);
  min-height: 58px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.24);
  color: #64748b;
  font-size: 10px;
}

.landing-footer a {
  color: #1e3a8a;
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 880px) {
  .landing-hero {
    min-height: auto;
    grid-template-columns: 1fr 0.85fr;
    gap: 12px;
    padding-block: 62px 30px;
  }

  .landing-art {
    min-height: 380px;
  }

  .pill-top { right: -14px; }
  .pill-bottom { left: -12px; }
}

@media (max-width: 640px) {
  .landing-page {
    padding-inline: 18px;
  }

  .landing-header {
    min-height: 72px;
  }

  .brand-crest {
    width: 38px;
    height: 38px;
  }

  .brand-wordmark strong {
    font-size: 12px;
  }

  .brand-wordmark small {
    font-size: 8px;
  }

  .landing-actions {
    gap: 12px;
  }

  .landing-explore {
    display: none;
  }

  .landing-signin {
    font-size: 12px;
  }

  .landing-create {
    min-height: 38px;
    gap: 5px;
    padding-inline: 10px;
    font-size: 11px;
  }

  .landing-create svg {
    width: 14px;
  }

  .landing-hero {
    grid-template-columns: 1fr;
    padding: 56px 0 18px;
  }

  .landing-copy h1 {
    margin-top: 20px;
    font-size: clamp(50px, 14vw, 72px);
  }

  .landing-art {
    min-height: 310px;
    margin-top: -6px;
  }

  .art-crest {
    width: 48%;
  }

  .art-caption {
    bottom: 8px;
  }

  .pill-top {
    top: 12%;
    right: 0;
  }

  .pill-bottom {
    bottom: 14%;
    left: 0;
  }

  .art-pill {
    padding: 10px 11px;
    font-size: 10px;
  }

  .campus-pulse {
    grid-template-columns: 1fr;
    gap: 8px;
    padding-bottom: 14px;
  }

  .landing-features {
    grid-template-columns: 1fr;
    gap: 10px;
    padding-bottom: 24px;
  }

  .feature-card {
    display: grid;
    grid-template-columns: 40px 1fr;
    column-gap: 13px;
    align-items: center;
    padding: 15px;
  }

  .feature-icon {
    grid-row: span 2;
  }

  .feature-card h2 {
    margin: 0 0 3px;
    font-size: 16px;
  }

  .feature-card p {
    grid-column: 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-create,
  .landing-primary {
    transition: none;
  }
}
</style>
