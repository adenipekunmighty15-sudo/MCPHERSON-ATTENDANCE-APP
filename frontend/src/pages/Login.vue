<template>
  <main class="auth-page">
    <div class="ambient-orbs" aria-hidden="true">
      <span class="ambient-orb orb-navy" />
      <span class="ambient-orb orb-gold" />
    </div>

    <div class="auth-shell">
      <!-- ── EDITORIAL SHOWCASE (45%) ───────────────────────────────── -->
      <section class="auth-showcase" aria-label="McPherson University portal showcase">
        <img class="showcase-image" :src="campusImage" alt="" aria-hidden="true" />
        <div class="showcase-scrim" aria-hidden="true" />

        <div class="crest-pattern" aria-hidden="true">
          <span class="crest-ring ring-one" />
          <span class="crest-ring ring-two" />
          <span class="crest-grid" />
          <Logo :size="220" class="crest-art" />
        </div>

        <header class="showcase-header">
          <router-link to="/welcome" class="showcase-brand" aria-label="McPherson University home">
            <span class="brand-crest" aria-hidden="true">
              <Logo :size="42" />
            </span>
            <span class="brand-wordmark">
              <strong>McPherson University</strong>
              <small>Citadel of Champions</small>
            </span>
          </router-link>
          <span class="showcase-badge">STUDENT PORTAL</span>
        </header>

        <div class="showcase-body">
          <div class="showcase-copy">
            <p class="showcase-eyebrow"><span aria-hidden="true" /> ONE CAMPUS &middot; ONE ACCOUNT</p>
            <h1>Your campus.<br /><em>In one place.</em></h1>
            <p class="showcase-intro">
              Attendance, courses and study tools — brought together in one clear university workspace.
            </p>

            <div class="onboarding-badge badge-light">
              <span class="badge-pulse" aria-hidden="true" />
              <Sparkles :size="13" aria-hidden="true" />
              {{ mode === 'signup' ? 'ONBOARDING · 2 MIN SETUP' : 'SECURE UNIVERSITY ACCESS' }}
            </div>
          </div>

          <div class="showcase-cards" aria-label="Portal highlights">
            <article class="glass-card">
              <span class="glass-icon"><ShieldCheck :size="16" aria-hidden="true" /></span>
              <span><small>ACCESS</small><strong>Verified sign-in</strong></span>
            </article>
            <article class="glass-card">
              <span class="glass-icon"><CalendarDays :size="16" aria-hidden="true" /></span>
              <span><small>ACADEMIC DAY</small><strong>Courses &amp; timetable</strong></span>
            </article>
            <article class="glass-card glass-card-accent">
              <span class="glass-icon"><Bell :size="16" aria-hidden="true" /></span>
              <span><small>ANNOUNCEMENT</small><strong>Complete your profile</strong></span>
            </article>
          </div>
        </div>

        <div class="showcase-rotator" aria-live="polite">
          <Transition name="rotate" mode="out-in">
            <figure :key="highlights[activeHighlight].title" class="rotate-item">
              <blockquote>{{ highlights[activeHighlight].text }}</blockquote>
              <figcaption>{{ highlights[activeHighlight].source }}</figcaption>
            </figure>
          </Transition>
          <div class="rotate-controls" role="group" aria-label="Campus highlights">
            <button
              v-for="(item, index) in highlights"
              :key="item.title"
              type="button"
              :class="{ active: activeHighlight === index }"
              :aria-label="`Show highlight ${index + 1}: ${item.title}`"
              :aria-pressed="activeHighlight === index"
              @click="activeHighlight = index"
            />
          </div>
        </div>

        <footer class="showcase-footer">
          <span><MapPin :size="11" aria-hidden="true" /> SERIKI SOTAYO &middot; OGUN STATE</span>
          <span>&copy; {{ year }} MCU</span>
        </footer>
      </section>

      <!-- ── AUTH WORKSPACE (55%) ────────────────────────────────────── -->
      <section class="auth-workspace" :aria-labelledby="mode === 'signin' ? 'signin-title' : 'signup-title'">
        <div class="auth-card" :class="{ 'signup-mode': mode === 'signup' }">
          <div class="mobile-brand">
            <span class="brand-crest" aria-hidden="true">
              <Logo :size="34" />
            </span>
            <span class="mobile-brand-copy">
              <strong>McPherson University</strong>
              <small>Citadel of Champions</small>
            </span>
            <span class="onboarding-badge badge-compact">
              <span class="badge-pulse" aria-hidden="true" />
              {{ mode === 'signup' ? 'SETUP' : 'SECURE' }}
            </span>
          </div>

          <header class="auth-heading">
            <p class="auth-eyebrow">{{ mode === 'signin' ? 'WELCOME BACK' : 'JOIN THE CITADEL' }}</p>
            <h2 :id="mode === 'signin' ? 'signin-title' : 'signup-title'">
              {{ mode === 'signin' ? 'Sign in to continue' : 'Create your account' }}
            </h2>
            <p>
              {{ mode === 'signin'
                ? 'Use your registered university account to access your portal.'
                : 'Set up your McPherson portal account in one short step.' }}
            </p>
          </header>

          <div v-if="!supabaseConfigured" class="config-alert" role="status">
            <AlertTriangle :size="16" aria-hidden="true" />
            <p>
              <strong>Portal authentication is in maintenance mode.</strong>
              Sign-in and account creation are temporarily unavailable. Please try again shortly or contact the IT helpdesk.
            </p>
          </div>

          <div class="auth-tabs" role="tablist" aria-label="Account access">
            <span class="tab-indicator" :class="{ 'is-signup': mode === 'signup' }" aria-hidden="true" />
            <button
              id="tab-signin"
              type="button"
              role="tab"
              :aria-selected="mode === 'signin'"
              :tabindex="mode === 'signin' ? 0 : -1"
              :class="{ active: mode === 'signin' }"
              @click="setMode('signin')"
              @keydown="onTabKeydown"
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              type="button"
              role="tab"
              :aria-selected="mode === 'signup'"
              :tabindex="mode === 'signup' ? 0 : -1"
              :class="{ active: mode === 'signup' }"
              @click="setMode('signup')"
              @keydown="onTabKeydown"
            >
              Create Account
            </button>
          </div>

          <Transition
            :css="false"
            mode="out-in"
            @before-enter="onBeforeEnter"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @before-leave="onBeforeLeave"
            @leave="onLeave"
          >
            <!-- ── SIGN IN ── -->
            <form
              v-if="mode === 'signin'"
              id="signin-panel"
              key="signin"
              role="tabpanel"
              aria-labelledby="tab-signin"
              class="auth-form"
              novalidate
              @submit.prevent="handleLogin"
            >
              <div class="field" :class="fieldClass('email')">
                <div class="input-wrap">
                  <Mail class="input-icon" :size="17" aria-hidden="true" />
                  <input
                    id="signin-email"
                    v-model.trim="email"
                    type="text"
                    name="email"
                    autocomplete="username"
                    inputmode="email"
                    placeholder=" "
                    :aria-invalid="!!errors.email"
                    :aria-describedby="errors.email ? 'signin-email-error signin-email-hint' : 'signin-email-chips signin-email-hint'"
                    @input="clearError('email')"
                    @blur="validateField('email')"
                  />
                  <label for="signin-email">University email</label>
                  <Check v-if="emailValid" class="valid-check" :size="17" aria-hidden="true" />
                </div>
                <p v-if="errors.email" id="signin-email-error" class="field-error" role="alert">{{ errors.email }}</p>
                <DomainChips id="signin-email-chips" @apply="applyDomain" />
                <p id="signin-email-hint" class="field-hint">Matric number? We’ll add @undergraduate.mcu.edu.ng automatically.</p>
              </div>

              <div class="field" :class="fieldClass('password')">
                <div class="input-wrap">
                  <LockKeyhole class="input-icon" :size="17" aria-hidden="true" />
                  <input
                    id="signin-password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    name="password"
                    autocomplete="current-password"
                    placeholder=" "
                    :aria-invalid="!!errors.password"
                    :aria-describedby="errors.password ? 'signin-password-error' : undefined"
                    @input="clearError('password')"
                    @blur="validateField('password')"
                  />
                  <label for="signin-password">Password</label>
                  <button
                    type="button"
                    class="field-action"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    :aria-pressed="showPassword"
                    @click="showPassword = !showPassword"
                  >
                    <EyeOff v-if="showPassword" :size="17" aria-hidden="true" />
                    <Eye v-else :size="17" aria-hidden="true" />
                  </button>
                </div>
                <p v-if="errors.password" id="signin-password-error" class="field-error" role="alert">{{ errors.password }}</p>
              </div>

              <div class="field-meta">
                <label class="remember-me">
                  <input v-model="rememberMe" type="checkbox" name="remember" />
                  <span>Remember me</span>
                </label>
                <button type="button" class="text-link" @click="handleForgot">Forgot password?</button>
              </div>

              <button type="submit" class="submit-btn" :disabled="isBusy" :aria-busy="isBusy">
                <span>{{ isBusy ? 'Signing in...' : 'Sign In' }}</span>
                <ArrowRight v-if="!isBusy" :size="17" aria-hidden="true" />
                <Loader2 v-else class="spin" :size="17" aria-hidden="true" />
              </button>

              <div class="divider"><span>or continue with</span></div>

              <button type="button" class="oauth-btn" :disabled="isBusy" @click="handleOAuth('google')">
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
            </form>

            <!-- ── CREATE ACCOUNT ── -->
            <form
              v-else
              id="signup-panel"
              key="signup"
              role="tabpanel"
              aria-labelledby="tab-signup"
              class="auth-form"
              novalidate
              @submit.prevent="handleSignup"
            >
              <div class="field-grid">
                <div class="field" :class="fieldClass('fullName')">
                  <div class="input-wrap">
                    <UserRound class="input-icon" :size="17" aria-hidden="true" />
                    <input
                      id="signup-name"
                      v-model.trim="fullName"
                      type="text"
                      name="name"
                      autocomplete="name"
                      placeholder=" "
                      :aria-invalid="!!errors.fullName"
                      @input="clearError('fullName')"
                      @blur="validateField('fullName')"
                    />
                    <label for="signup-name">Full name</label>
                  </div>
                  <p v-if="errors.fullName" class="field-error" role="alert">{{ errors.fullName }}</p>
                </div>

                <div class="field" :class="fieldClass('identifier')">
                  <div class="input-wrap">
                    <IdCard class="input-icon" :size="17" aria-hidden="true" />
                    <input
                      id="signup-id"
                      v-model.trim="identifier"
                      type="text"
                      name="identifier"
                      autocomplete="off"
                      placeholder=" "
                      :aria-invalid="!!errors.identifier"
                      @input="clearError('identifier')"
                      @blur="validateField('identifier')"
                    />
                    <label for="signup-id">Matric / Staff ID</label>
                  </div>
                  <p v-if="errors.identifier" class="field-error" role="alert">{{ errors.identifier }}</p>
                </div>
              </div>

              <div class="field" :class="fieldClass('email')">
                <div class="input-wrap">
                  <Mail class="input-icon" :size="17" aria-hidden="true" />
                  <input
                    id="signup-email"
                    v-model.trim="email"
                    type="email"
                    name="email"
                    autocomplete="email"
                    inputmode="email"
                    placeholder=" "
                    :aria-invalid="!!errors.email"
                    :aria-describedby="errors.email ? 'signup-email-error' : 'signup-email-chips'"
                    @input="clearError('email')"
                    @blur="validateField('email')"
                  />
                  <label for="signup-email">University email</label>
                  <Check v-if="emailValid" class="valid-check" :size="17" aria-hidden="true" />
                </div>
                <p v-if="errors.email" id="signup-email-error" class="field-error" role="alert">{{ errors.email }}</p>
                <DomainChips id="signup-email-chips" @apply="applyDomain" />
              </div>

              <div ref="comboboxRef" class="field combobox-field" :class="fieldClass('department')">
                <div class="input-wrap combo-wrap" :class="{ 'is-open': departmentOpen }">
                  <GraduationCap class="input-icon" :size="17" aria-hidden="true" />
                  <input
                    id="department-search"
                    v-model="departmentQuery"
                    type="text"
                    name="department"
                    role="combobox"
                    autocomplete="off"
                    placeholder=" "
                    aria-label="Search departments"
                    :aria-expanded="departmentOpen"
                    :aria-controls="departmentOpen ? 'department-listbox' : undefined"
                    :aria-activedescendant="departmentOpen && activeDepartmentCode ? `dept-option-${activeDepartmentCode}` : undefined"
                    :aria-invalid="!!errors.department"
                    @focus="openDepartments"
                    @input="onDepartmentInput"
                    @keydown="onDepartmentKeydown"
                    @blur="onDepartmentBlur"
                  />
                  <label for="department-search">Department</label>
                  <span v-if="selectedCode && !departmentOpen" class="dept-badge">{{ selectedCode }}</span>
                  <button
                    type="button"
                    class="combo-toggle"
                    :aria-label="departmentOpen ? 'Close department list' : 'Open department list'"
                    :aria-expanded="departmentOpen"
                    @click="toggleDepartments"
                  >
                    <ChevronDown :size="17" aria-hidden="true" />
                  </button>

                  <Transition name="dropdown">
                    <ul
                      v-if="departmentOpen"
                      id="department-listbox"
                      role="listbox"
                      aria-label="Departments"
                      class="combo-list"
                    >
                      <template v-if="!filteredDepartments.length">
                        <li class="combo-empty">No departments found</li>
                      </template>
                      <template v-else>
                        <template v-for="group in groupedDepartments" :key="`group-${group.code}`">
                          <li class="combo-group" role="presentation">
                            <span class="combo-group-label">{{ group.name }}</span>
                          </li>
                          <li
                            v-for="dept in group.items"
                            :id="`dept-option-${dept.code}`"
                            :key="dept.code"
                            role="option"
                            :aria-selected="department === dept.name"
                            :class="{ active: activeDepartmentCode === dept.code, selected: department === dept.name }"
                            @mousedown.prevent="selectDepartment(dept)"
                            @mouseenter="activeDepartmentCode = dept.code"
                          >
                            <span class="dept-code">{{ dept.code }}</span>
                            <span class="dept-copy">
                              <span class="dept-name">{{ dept.name }}</span>
                              <span class="dept-college">{{ group.shortName }}</span>
                            </span>
                            <Check v-if="department === dept.name" :size="14" aria-hidden="true" />
                          </li>
                        </template>
                      </template>
                    </ul>
                  </Transition>
                </div>
                <p v-if="errors.department" class="field-error" role="alert">{{ errors.department }}</p>
              </div>

              <div class="field-grid">
                <div class="field" :class="fieldClass('password')">
                  <div class="input-wrap">
                    <LockKeyhole class="input-icon" :size="17" aria-hidden="true" />
                    <input
                      id="signup-password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      name="new-password"
                      autocomplete="new-password"
                      placeholder=" "
                      :aria-invalid="!!errors.password"
                      :aria-describedby="password ? 'password-strength' : undefined"
                      @input="clearError('password')"
                      @blur="validateField('password')"
                    />
                    <label for="signup-password">Password</label>
                    <button
                      type="button"
                      class="field-action"
                      :aria-label="showPassword ? 'Hide password' : 'Show password'"
                      :aria-pressed="showPassword"
                      @click="showPassword = !showPassword"
                    >
                      <EyeOff v-if="showPassword" :size="17" aria-hidden="true" />
                      <Eye v-else :size="17" aria-hidden="true" />
                    </button>
                  </div>
                  <p v-if="errors.password" class="field-error" role="alert">{{ errors.password }}</p>

                  <div v-if="password" id="password-strength" class="strength" :class="`strength-${strengthLabel.toLowerCase()}`" aria-live="polite">
                    <div class="strength-bars" aria-hidden="true">
                      <span v-for="bar in 5" :key="bar" :class="{ filled: bar <= strengthScore }" />
                    </div>
                    <span class="strength-label">{{ strengthLabel }}</span>
                  </div>
                  <ul class="req-list" aria-label="Password requirements">
                    <li v-for="req in passwordRequirements" :key="req.label" class="req-pill" :class="{ met: req.met }">
                      <Check v-if="req.met" :size="11" aria-hidden="true" />
                      <span v-else class="req-dot" aria-hidden="true" />
                      {{ req.label }}
                    </li>
                  </ul>
                </div>

                <div class="field" :class="fieldClass('confirmPassword')">
                  <div class="input-wrap">
                    <LockKeyhole class="input-icon" :size="17" aria-hidden="true" />
                    <input
                      id="signup-confirm"
                      v-model="confirmPassword"
                      :type="showConfirm ? 'text' : 'password'"
                      name="new-password-confirm"
                      autocomplete="new-password"
                      placeholder=" "
                      :aria-invalid="!!errors.confirmPassword"
                      @input="clearError('confirmPassword')"
                      @blur="validateField('confirmPassword')"
                    />
                    <label for="signup-confirm">Confirm password</label>
                    <Check v-if="passwordsMatch" class="match-check" :size="17" aria-label="Passwords match" />
                    <button
                      v-else
                      type="button"
                      class="field-action"
                      :aria-label="showConfirm ? 'Hide confirmation' : 'Show confirmation'"
                      :aria-pressed="showConfirm"
                      @click="showConfirm = !showConfirm"
                    >
                      <EyeOff v-if="showConfirm" :size="17" aria-hidden="true" />
                      <Eye v-else :size="17" aria-hidden="true" />
                    </button>
                  </div>
                  <p v-if="errors.confirmPassword" class="field-error" role="alert">{{ errors.confirmPassword }}</p>
                  <p v-else-if="passwordsMatch" class="field-success"><Check :size="12" aria-hidden="true" /> Passwords match</p>
                </div>
              </div>

              <button type="submit" class="submit-btn" :disabled="isBusy" :aria-busy="isBusy">
                <span>{{ isBusy ? 'Creating account...' : 'Create Account' }}</span>
                <ArrowRight v-if="!isBusy" :size="17" aria-hidden="true" />
                <Loader2 v-else class="spin" :size="17" aria-hidden="true" />
              </button>

              <div class="divider"><span>or continue with</span></div>

              <button type="button" class="oauth-btn" :disabled="isBusy" @click="handleOAuth('google')">
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
            </form>
          </Transition>
        </div>

        <p class="workspace-footer">&copy; {{ year }} McPherson University <span aria-hidden="true">&middot;</span> Citadel of Champions</p>
      </section>
    </div>

    <!-- ── HELP WIDGET ───────────────────────────────────────────────── -->
    <div ref="helpWidget" class="help-widget">
      <Transition name="pop">
        <section v-if="helpOpen" id="help-popover" class="help-popover" role="dialog" aria-labelledby="help-heading">
          <div class="help-heading">
            <span class="help-icon" aria-hidden="true">?</span>
            <span>
              <strong id="help-heading">Need a hand?</strong>
              <small>We are here to help.</small>
            </span>
          </div>
          <a href="mailto:ict@mcu.edu.ng" class="help-link" @click="helpOpen = false">
            <span class="help-link-icon" aria-hidden="true">@</span>
            <span><strong>IT Helpdesk</strong><small>ict@mcu.edu.ng</small></span>
          </a>
          <router-link to="/welcome" class="help-link" @click="helpOpen = false">
            <span class="help-link-icon" aria-hidden="true">&#8599;</span>
            <span><strong>Student Portal Guide</strong><small>Quick platform overview</small></span>
          </router-link>
          <router-link to="/forgot-password" class="help-link" @click="helpOpen = false">
            <span class="help-link-icon" aria-hidden="true">&#9906;</span>
            <span><strong>Account Recovery</strong><small>Reset your password</small></span>
          </router-link>
        </section>
      </Transition>

      <button
        type="button"
        class="help-trigger"
        :aria-expanded="helpOpen"
        :aria-controls="helpOpen ? 'help-popover' : undefined"
        :aria-label="helpOpen ? 'Close quick help' : 'Open quick help'"
        @click="helpOpen = !helpOpen"
      >
        <span aria-hidden="true">?</span>
      </button>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-vue-next'
import Logo from '../components/Logo.vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { supabaseConfigured, setRememberMe } from '../lib/supabase'
import {
  colleges,
  departments as universityDepartments,
  searchDepartments,
} from '../data/university'
import campusImage from '../assets/mcu-campus.jpg'

const props = defineProps({
  initialMode: { type: String, default: '' },
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToastStore()

// Inline sub-components keep the template tidy without adding a dependency.
const GoogleIcon = {
  name: 'GoogleIcon',
  setup() {
    return () => h('svg', { class: 'google-icon', viewBox: '0 0 24 24', 'aria-hidden': 'true' }, [
      h('path', { fill: '#4285F4', d: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z' }),
      h('path', { fill: '#34A853', d: 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z' }),
      h('path', { fill: '#FBBC05', d: 'M5.84 14.09a7 7 0 0 1 0-4.18V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z' }),
      h('path', { fill: '#EA4335', d: 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z' }),
    ])
  },
}

const DomainChips = {
  name: 'DomainChips',
  emits: ['apply'],
  props: { id: { type: String, default: undefined } },
  setup(props, { emit }) {
    const chips = ['mcu.edu.ng', 'undergraduate.mcu.edu.ng', 'mcpherson.edu', 'gmail.com']
    return () => h('div', { id: props.id, class: 'domain-chips', role: 'group', 'aria-label': 'Quick-fill email domains' },
      chips.map((domain) => h('button', {
        type: 'button',
        key: domain,
        class: 'domain-chip',
        onClick: () => emit('apply', domain),
      }, `@${domain}`)))
  },
}

function resolveMode() {
  if (route.path === '/signup') return 'signup'
  const queryMode = route.query.mode
  if (queryMode === 'signin' || queryMode === 'signup') return queryMode
  if (route.path === '/login') return 'signin'
  return props.initialMode === 'signup' ? 'signup' : 'signin'
}

function authRouteQuery() {
  const query = { ...route.query }
  delete query.mode
  return query
}

const mode = ref(resolveMode())
const email = ref('')
const password = ref('')
const fullName = ref('')
const identifier = ref('')
const confirmPassword = ref('')
const department = ref('')
const departmentQuery = ref('')
const departmentOpen = ref(false)
const activeDepartmentCode = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const helpOpen = ref(false)
const helpWidget = ref(null)
const comboboxRef = ref(null)
const activeHighlight = ref(0)
const submitting = ref(false)
const rememberMe = ref(true)

const errors = reactive({})
const shake = reactive({})

const year = new Date().getFullYear()
const tabs = ['signin', 'signup']
const allowedDomains = ['mcu.edu.ng', 'undergraduate.mcu.edu.ng', 'mcpherson.edu', 'gmail.com']
const defaultStudentDomain = 'undergraduate.mcu.edu.ng'
const studentIdPattern = /^[A-Za-z0-9][A-Za-z0-9/_-]{2,23}$/

const departments = universityDepartments

const highlights = [
  { title: 'Attendance', text: 'Check in with confidence and see your session status before you leave class.', source: 'STUDENT EXPERIENCE' },
  { title: 'Course tools', text: 'Keep your courses, timetable and campus notices together in one academic day.', source: 'ACADEMIC TOOLS' },
  { title: 'Study Hub', text: 'Review notes, quizzes and learning resources in your dedicated study workspace.', source: 'STUDY WORKSPACE' },
]

const isBusy = computed(() => submitting.value || authStore.loading)

let highlightTimer = null
const shakeTimers = []

function isValidEmail(value) {
  const candidate = String(value || '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) return false
  const domain = candidate.slice(candidate.lastIndexOf('@') + 1).toLowerCase()
  return allowedDomains.includes(domain)
}

const emailValid = computed(() => isValidEmail(email.value))

function normalizeSignInEmail() {
  const value = String(email.value || '').trim()
  if (!value || value.includes('@') || !studentIdPattern.test(value)) return value
  const normalized = `${value}@${defaultStudentDomain}`
  email.value = normalized
  return normalized
}

const selectedCode = computed(() => departments.find((dept) => dept.name === department.value)?.code || '')

const filteredDepartments = computed(() => searchDepartments(departmentQuery.value))

const groupedDepartments = computed(() => colleges
  .map((college) => ({
    ...college,
    items: filteredDepartments.value.filter((dept) => dept.college === college.code),
  }))
  .filter((group) => group.items.length > 0))

const flatDepartments = computed(() => groupedDepartments.value.flatMap((group) => group.items))

function findExactDepartment(query) {
  const candidate = String(query || '').trim().toLowerCase()
  if (!candidate) return null
  return departments.find((dept) =>
    [dept.name, dept.code, dept.id, ...dept.aliases]
      .some((value) => String(value).toLowerCase() === candidate))
}

const passwordRequirements = computed(() => [
  { label: '8+ characters', met: password.value.length >= 8 && password.value.length <= 128 },
  { label: 'Uppercase', met: /[A-Z]/.test(password.value) },
  { label: 'Lowercase', met: /[a-z]/.test(password.value) },
  { label: 'Number', met: /\d/.test(password.value) },
  { label: 'Symbol', met: /[^A-Za-z0-9]/.test(password.value) },
])

const strengthScore = computed(() => passwordRequirements.value.filter((item) => item.met).length)
const strengthLabel = computed(() => {
  if (strengthScore.value <= 1) return 'Weak'
  if (strengthScore.value <= 4) return 'Fair'
  return 'Strong'
})
const passwordsMatch = computed(() => !!confirmPassword.value && password.value === confirmPassword.value)

function fieldClass(field) {
  return {
    'has-error': !!errors[field],
    'is-shaking': !!shake[field],
    'has-status': field === 'email' && emailValid.value,
  }
}

function clearError(field) {
  delete errors[field]
}

function triggerShake(fields) {
  fields.forEach((field) => {
    shake[field] = false
    requestAnimationFrame(() => { shake[field] = true })
    shakeTimers.push(setTimeout(() => { shake[field] = false }, 420))
  })
}

function validateField(field) {
  delete errors[field]

  if (field === 'email') {
    if (mode.value === 'signin') normalizeSignInEmail()
    if (!email.value.trim()) errors.email = 'Enter your university email.'
    else if (!emailValid.value) errors.email = 'Use an accepted McPherson or Gmail domain.'
  }

  if (field === 'fullName') {
    if (fullName.value.trim().length < 2) errors.fullName = 'Enter your full name.'
  }

  if (field === 'identifier') {
    const value = identifier.value.trim()
    if (!value) errors.identifier = 'Enter your matric number or staff ID.'
    else if (!studentIdPattern.test(value)) errors.identifier = 'Use 3–24 letters, numbers, /, - or _.'
  }

  if (field === 'department') {
    const exact = findExactDepartment(departmentQuery.value)
    if (exact && department.value !== exact.name) {
      selectDepartment(exact)
    } else if (!department.value && departmentQuery.value.trim()) {
      errors.department = 'Choose a department from the list.'
    } else if (!department.value) {
      errors.department = 'Choose a department.'
    }
  }

  if (field === 'password') {
    if (!password.value) errors.password = 'Enter a password.'
    else if (passwordRequirements.value.some((rule) => !rule.met)) {
      errors.password = 'Use 8–128 characters with uppercase, lowercase, number and symbol.'
    }
  }

  if (field === 'confirmPassword') {
    if (!confirmPassword.value) errors.confirmPassword = 'Confirm your password.'
    else if (!passwordsMatch.value) errors.confirmPassword = 'Passwords do not match.'
  }

  if (errors[field]) triggerShake([field])
}

function applyDomain(domain) {
  const localPart = email.value.split('@')[0].trim()
  if (!localPart) {
    errors.email = 'Enter your username first, then pick a domain.'
    triggerShake(['email'])
    return
  }
  email.value = `${localPart}@${domain}`
  clearError('email')
}

function openDepartments() {
  departmentOpen.value = true
  const selected = departments.find((dept) => dept.name === department.value)
  activeDepartmentCode.value = (selected || flatDepartments.value[0])?.code || ''
}

function closeDepartments() {
  departmentOpen.value = false
}

function toggleDepartments() {
  if (departmentOpen.value) closeDepartments()
  else {
    openDepartments()
    nextTick(() => document.getElementById('department-search')?.focus())
  }
}

function onDepartmentInput() {
  clearError('department')
  // Editing the query invalidates a previous selection.
  department.value = ''
  departmentOpen.value = true
  activeDepartmentCode.value = flatDepartments.value[0]?.code || ''
}

function selectDepartment(dept) {
  department.value = dept.name
  departmentQuery.value = dept.name
  activeDepartmentCode.value = dept.code
  departmentOpen.value = false
  clearError('department')
}

function moveDepartmentSelection(step) {
  const options = flatDepartments.value
  if (!options.length) return
  const currentIndex = options.findIndex((dept) => dept.code === activeDepartmentCode.value)
  const nextIndex = currentIndex < 0
    ? (step > 0 ? 0 : options.length - 1)
    : Math.min(Math.max(currentIndex + step, 0), options.length - 1)
  activeDepartmentCode.value = options[nextIndex].code

  nextTick(() => {
    document.getElementById(`dept-option-${activeDepartmentCode.value}`)?.scrollIntoView({ block: 'nearest' })
  })
}

function onDepartmentKeydown(event) {
  if (event.key === 'Escape') {
    closeDepartments()
    return
  }
  if (!departmentOpen.value && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
    openDepartments()
    return
  }
  if (!departmentOpen.value) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveDepartmentSelection(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveDepartmentSelection(-1)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const dept = flatDepartments.value.find((item) => item.code === activeDepartmentCode.value)
    if (dept) selectDepartment(dept)
  }
}

function onDepartmentBlur() {
  setTimeout(() => {
    validateField('department')
    closeDepartments()
  }, 120)
}

function setMode(next, syncRoute = true) {
  if (!tabs.includes(next)) return
  const changed = mode.value !== next
  if (changed) {
    mode.value = next
    Object.keys(errors).forEach((key) => delete errors[key])
    Object.keys(shake).forEach((key) => delete shake[key])
    confirmPassword.value = ''
    showConfirm.value = false
    closeDepartments()
  }

  if (syncRoute) {
    const targetPath = next === 'signup' ? '/signup' : '/login'
    if (route.path !== targetPath) router.replace({ path: targetPath, query: authRouteQuery() })
  }
}

watch(
  () => route.fullPath,
  () => {
    if (route.path === '/signup') {
      setMode('signup', false)
      return
    }
    if (route.path === '/login') {
      const queryMode = route.query.mode
      setMode(queryMode === 'signup' ? 'signup' : 'signin', false)
    }
  },
)

watch(
  () => props.initialMode,
  (value) => {
    if (value === 'signup' || value === 'signin') setMode(value, false)
  },
)

function onTabKeydown(event) {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (!keys.includes(event.key)) return
  event.preventDefault()

  const current = tabs.indexOf(mode.value)
  let nextIndex = current
  if (event.key === 'ArrowLeft') nextIndex = (current - 1 + tabs.length) % tabs.length
  if (event.key === 'ArrowRight') nextIndex = (current + 1) % tabs.length
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = tabs.length - 1

  const next = tabs[nextIndex]
  setMode(next)
  nextTick(() => document.getElementById(`tab-${next}`)?.focus())
}

function safeRedirect() {
  const redirect = route.query.redirect
  if (typeof redirect !== 'string' || !redirect.startsWith('/') || redirect.startsWith('//') || redirect.startsWith('/\\')) return '/'
  const hasControlChar = Array.from(redirect).some((char) => {
    const code = char.charCodeAt(0)
    return code <= 31 || code === 127
  })
  if (hasControlChar || /^[a-z][a-z0-9+.-]*:/i.test(redirect.slice(1))) return '/'

  const parsed = new URL(redirect, window.location.origin)
  if (parsed.origin !== window.location.origin) return '/'
  const path = parsed.pathname
  if (/^\/(login|signup|welcome)(\/|$)/i.test(path)) return '/'
  return `${path}${parsed.search}${parsed.hash}`
}

function validateAll(fields) {
  Object.keys(errors).forEach((key) => delete errors[key])
  fields.forEach(validateField)
  const invalid = fields.filter((field) => !!errors[field])
  if (invalid.length) triggerShake(invalid)
  return invalid.length === 0
}

const authConfigMessage = 'Portal authentication is currently unavailable. Please try again shortly.'

function ensureAuthConfigured() {
  if (supabaseConfigured) return true
  console.warn('[auth] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY; authentication actions are disabled.')
  toast.error(authConfigMessage)
  return false
}

function formatAuthError(err, fallback) {
  const message = String(err?.message || authStore.error || '')
  if (/not configured/i.test(message)) return authConfigMessage
  return message || fallback
}

async function handleLogin() {
  if (isBusy.value) return
  const loginEmail = normalizeSignInEmail()
  if (!validateAll(['email', 'password']) || !ensureAuthConfigured()) return
  setRememberMe(rememberMe.value)
  submitting.value = true
  try {
    await authStore.signIn(loginEmail, password.value)
    toast.success('Welcome back to your portal.')
    router.push(safeRedirect())
  } catch (err) {
    toast.error(formatAuthError(err, 'Unable to sign in. Please try again.'))
  } finally {
    submitting.value = false
  }
}

async function handleSignup() {
  if (isBusy.value || !validateAll(['fullName', 'identifier', 'email', 'department', 'password', 'confirmPassword']) || !ensureAuthConfigured()) return
  submitting.value = true
  try {
    // Existing store action and metadata contract are unchanged; backend role remains authoritative.
    await authStore.signUp(email.value.trim().toLowerCase(), password.value, {
      name: fullName.value.trim(),
      full_name: fullName.value.trim(),
      matric: identifier.value.trim(),
      matric_number: identifier.value.trim(),
      matricNumber: identifier.value.trim(),
      staff_id: identifier.value.trim(),
      department: department.value,
      role: 'student',
    })

    toast.success('Your account is ready. Welcome to McPherson!')
    router.push({ name: 'Dashboard' })
  } catch (err) {
    toast.error(formatAuthError(err, 'Unable to create your account. Please try again.'))
  } finally {
    submitting.value = false
  }
}

async function handleForgot() {
  if (!ensureAuthConfigured()) return
  normalizeSignInEmail()
  if (!email.value.trim()) {
    errors.email = 'Enter your email first so we can send a reset link.'
    triggerShake(['email'])
    toast.warning('Enter your email first to reset your password.')
    return
  }
  if (!emailValid.value) {
    errors.email = 'Use an accepted McPherson or Gmail domain.'
    triggerShake(['email'])
    return
  }
  try {
    await authStore.resetPasswordForEmail(email.value.trim())
    toast.success('Password reset link sent. Check your inbox.')
  } catch (err) {
    toast.error(formatAuthError(err, 'Unable to send a reset link right now.'))
  }
}

async function handleOAuth(provider) {
  if (isBusy.value || !ensureAuthConfigured()) return
  try {
    await authStore.signInWithOAuth(provider)
  } catch (err) {
    toast.error(formatAuthError(err, `Unable to continue with ${provider}.`))
  }
}

function handleGlobalKeydown(event) {
  if (event.key === 'Escape') {
    if (helpOpen.value) helpOpen.value = false
    if (departmentOpen.value) closeDepartments()
  }
}

function handleOutsideClick(event) {
  if (helpOpen.value && helpWidget.value && !helpWidget.value.contains(event.target)) helpOpen.value = false
  if (departmentOpen.value && comboboxRef.value && !comboboxRef.value.contains(event.target)) closeDepartments()
}

/* ── Form morph hooks ─────────────────────────────────────────────── */
function finishTransition(el, done) {
  let completed = false
  const finish = (event) => {
    if (event && (event.target !== el || event.propertyName !== 'height')) return
    if (completed) return
    completed = true
    el.removeEventListener('transitionend', finish)
    done()
  }
  el.addEventListener('transitionend', finish)
  setTimeout(() => finish(), 420)
}

function onBeforeEnter(el) {
  el.style.height = '0px'
  el.style.opacity = '0'
  el.style.transform = 'translateY(10px)'
  el.style.overflow = 'hidden'
}

function onEnter(el, done) {
  const target = el.scrollHeight
  requestAnimationFrame(() => {
    el.style.height = `${target}px`
    el.style.opacity = '1'
    el.style.transform = 'translateY(0)'
  })
  finishTransition(el, done)
}

function onAfterEnter(el) {
  el.style.height = 'auto'
  el.style.overflow = 'visible'
  el.style.transform = ''
}

function onBeforeLeave(el) {
  el.style.height = `${el.scrollHeight}px`
  el.style.overflow = 'hidden'
}

function onLeave(el, done) {
  requestAnimationFrame(() => {
    el.style.height = '0px'
    el.style.opacity = '0'
    el.style.transform = 'translateY(-8px)'
  })
  finishTransition(el, done)
}

onMounted(async () => {
  const queryMode = route.query.mode
  if (queryMode === 'signup' || queryMode === 'signin') {
    const targetPath = queryMode === 'signup' ? '/signup' : '/login'
    if (route.path !== targetPath) router.replace({ path: targetPath, query: authRouteQuery() })
  }

  highlightTimer = window.setInterval(() => {
    activeHighlight.value = (activeHighlight.value + 1) % highlights.length
  }, 6500)
  window.addEventListener('keydown', handleGlobalKeydown)
  document.addEventListener('click', handleOutsideClick)
  await authStore.ready
  if (route.query.reason === 'session-expired') {
    toast.warning('Your session ended. Please sign in again.')
  }
  if (authStore.isAuthenticated) router.push(safeRedirect())
})

onUnmounted(() => {
  if (highlightTimer) window.clearInterval(highlightTimer)
  shakeTimers.forEach((timer) => clearTimeout(timer))
  window.removeEventListener('keydown', handleGlobalKeydown)
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
.auth-page {
  --navy: #0b192c;
  --navy-deep: #07111f;
  --navy-soft: #142744;
  --gold: #d4af37;
  --gold-light: #f2df9c;
  --slate-bg: #f8fafc;
  --slate-line: #e2e8f0;
  --slate-text: #475569;
  min-height: 100dvh;
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: clamp(12px, 2vw, 28px);
  background: var(--slate-bg);
  color: var(--navy);
  font-family: var(--font-sans, Inter, system-ui, sans-serif);
  font-variant-numeric: tabular-nums;
}

.auth-page :focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}

.ambient-orbs {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.5;
}

.orb-navy {
  width: 420px;
  height: 420px;
  top: -190px;
  left: -150px;
  background: rgba(11, 25, 44, 0.14);
}

.orb-gold {
  width: 340px;
  height: 340px;
  right: -120px;
  bottom: -160px;
  background: rgba(212, 175, 55, 0.2);
}

.auth-shell {
  position: relative;
  z-index: 1;
  width: min(100%, 1360px);
  height: min(900px, calc(100dvh - 40px));
  min-height: 620px;
  display: grid;
  grid-template-columns: minmax(0, 45fr) minmax(0, 55fr);
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 34px 90px rgba(11, 25, 44, 0.14), 0 8px 24px rgba(11, 25, 44, 0.05);
  backdrop-filter: blur(20px);
}

/* ── SHOWCASE ── */
.auth-showcase {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  padding: clamp(24px, 2.4vw, 38px);
  overflow: hidden;
  color: #f8fafc;
  isolation: isolate;
}

.showcase-image,
.showcase-scrim {
  position: absolute;
  inset: 0;
  z-index: -3;
  width: 100%;
  height: 100%;
}

.showcase-image {
  object-fit: cover;
  filter: saturate(0.65);
  transform: scale(1.03);
}

.showcase-scrim {
  z-index: -2;
  background:
    radial-gradient(circle at 84% 16%, rgba(212, 175, 55, 0.18), transparent 32%),
    linear-gradient(158deg, rgba(20, 39, 68, 0.97) 0%, rgba(11, 25, 44, 0.96) 58%, rgba(7, 17, 31, 0.98) 100%);
}

.crest-pattern {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.crest-ring {
  position: absolute;
  border: 1px solid rgba(248, 250, 252, 0.1);
  border-radius: 50%;
  animation: crestSpin 34s linear infinite;
}

.ring-one {
  width: 520px;
  height: 520px;
  top: -210px;
  right: -220px;
}

.ring-two {
  width: 360px;
  height: 360px;
  right: -100px;
  bottom: -150px;
  border-color: rgba(212, 175, 55, 0.3);
  animation-direction: reverse;
  animation-duration: 26s;
}

.crest-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(248, 250, 252, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(248, 250, 252, 0.04) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent);
}

.crest-art {
  position: absolute;
  right: -58px;
  bottom: -62px;
  opacity: 0.09;
  animation: crestFloat 9s ease-in-out infinite;
}

.showcase-header,
.showcase-body,
.showcase-rotator,
.showcase-footer {
  position: relative;
  z-index: 1;
}

.showcase-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.showcase-brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: inherit;
  text-decoration: none;
}

.brand-crest {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: var(--gold);
}

.brand-crest svg {
  width: 100%;
  height: 100%;
}

.brand-wordmark {
  display: grid;
  gap: 2px;
}

.brand-wordmark strong {
  font-family: var(--font-display, Georgia, serif);
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.brand-wordmark small {
  color: rgba(226, 232, 240, 0.66);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.showcase-badge {
  padding: 7px 11px;
  border: 1px solid rgba(248, 250, 252, 0.18);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.07);
  color: rgba(248, 250, 252, 0.82);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.14em;
  white-space: nowrap;
}

.showcase-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px;
  align-items: center;
  gap: 26px;
}

.showcase-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 18px;
  color: rgba(226, 232, 240, 0.72);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.showcase-eyebrow span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.16);
}

.showcase-copy h1 {
  margin: 0;
  font-family: var(--font-display, Georgia, serif);
  font-size: clamp(38px, 3.7vw, 57px);
  font-weight: 600;
  line-height: 0.98;
  letter-spacing: -0.06em;
}

.showcase-copy h1 em {
  color: var(--gold-light);
  font-style: normal;
  font-weight: 500;
}

.showcase-intro {
  max-width: 400px;
  margin: 14px 0 0;
  color: rgba(226, 232, 240, 0.76);
  font-size: 12px;
  line-height: 1.6;
}

.onboarding-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 20px;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.badge-light {
  border: 1px solid rgba(212, 175, 55, 0.35);
  background: rgba(212, 175, 55, 0.12);
  color: var(--gold-light);
}

.badge-compact {
  margin: 0;
  padding: 5px 8px;
  border: 1px solid rgba(212, 175, 55, 0.28);
  background: rgba(212, 175, 55, 0.1);
  color: #8a6d13;
  letter-spacing: 0.1em;
}

.badge-pulse {
  position: relative;
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--gold);
}

.badge-pulse::after {
  position: absolute;
  inset: -3px;
  border: 1px solid var(--gold);
  border-radius: 50%;
  content: '';
  animation: badgePulse 1.8s ease-out infinite;
}

.showcase-cards {
  display: grid;
  gap: 10px;
}

.glass-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(248, 250, 252, 0.14);
  border-radius: 15px;
  background: rgba(248, 250, 252, 0.07);
  box-shadow: 0 12px 28px rgba(7, 17, 31, 0.16);
  backdrop-filter: blur(12px);
  transition: transform 200ms ease, border-color 200ms ease, background 200ms ease;
  animation: cardFloat 7s ease-in-out infinite;
}

.glass-card:nth-child(2) { animation-delay: 1.2s; }
.glass-card:nth-child(3) { animation-delay: 2.4s; }

.glass-card:hover {
  transform: translateX(-4px);
  border-color: rgba(212, 175, 55, 0.4);
  background: rgba(248, 250, 252, 0.1);
}

.glass-card-accent {
  border-color: rgba(212, 175, 55, 0.3);
  background: rgba(212, 175, 55, 0.1);
}

.glass-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 10px;
  background: rgba(212, 175, 55, 0.16);
  color: var(--gold-light);
}

.glass-card span:last-child {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.glass-card small {
  color: rgba(226, 232, 240, 0.55);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.glass-card strong {
  overflow: hidden;
  font-size: 11px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.showcase-rotator {
  max-width: 520px;
  min-height: 96px;
  padding: 13px 18px;
  border-left: 2px solid rgba(212, 175, 55, 0.55);
  border-radius: 0 14px 14px 0;
  background: linear-gradient(90deg, rgba(248, 250, 252, 0.06), transparent);
}

.rotate-item {
  margin: 0;
}

.rotate-item blockquote {
  margin: 0 0 7px;
  color: rgba(248, 250, 252, 0.92);
  font-size: 12px;
  font-style: italic;
  line-height: 1.6;
}

.rotate-item figcaption {
  color: rgba(226, 232, 240, 0.5);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.rotate-controls {
  display: flex;
  gap: 6px;
  margin-top: 11px;
}

.rotate-controls button {
  width: 20px;
  height: 4px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.25);
  cursor: pointer;
  transition: width 220ms ease, background 220ms ease;
}

.rotate-controls button.active {
  width: 34px;
  background: var(--gold);
}

.showcase-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: rgba(226, 232, 240, 0.46);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.showcase-footer span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.rotate-enter-active,
.rotate-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.rotate-enter-from { opacity: 0; transform: translateY(7px); }
.rotate-leave-to { opacity: 0; transform: translateY(-7px); }

@keyframes crestSpin { to { transform: rotate(360deg); } }
@keyframes crestFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes badgePulse {
  0% { opacity: 0.9; transform: scale(0.6); }
  100% { opacity: 0; transform: scale(1.7); }
}
@keyframes cardFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* ── WORKSPACE ── */
.auth-workspace {
  position: relative;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: clamp(20px, 2.6vw, 42px) clamp(20px, 3vw, 52px) 48px;
  background: rgba(248, 250, 252, 0.55);
  scrollbar-width: none;
}

.auth-workspace::-webkit-scrollbar { display: none; }

.auth-card {
  width: min(100%, 600px);
  position: relative;
}

.auth-card::before {
  position: absolute;
  top: 0;
  left: 28px;
  right: 28px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--navy) 0%, #1b3150 48%, var(--gold) 100%);
  background-size: 220% 100%;
  background-position: 0% 0;
  content: '';
  transition: background-position 420ms ease;
}

.auth-card.signup-mode::before { background-position: 100% 0; }

.mobile-brand {
  display: none;
}

.auth-heading {
  margin-bottom: 16px;
}

.auth-eyebrow {
  margin: 0 0 6px;
  color: #8a6d13;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.auth-heading h2 {
  margin: 0;
  font-family: var(--font-display, Georgia, serif);
  font-size: clamp(22px, 2vw, 28px);
  font-weight: 650;
  letter-spacing: -0.045em;
}

.auth-heading > p:last-child {
  margin: 5px 0 0;
  color: var(--slate-text);
  font-size: 12px;
  line-height: 1.5;
}

.config-alert {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 0 0 12px;
  padding: 9px 11px;
  border: 1px solid rgba(217, 119, 6, 0.24);
  border-radius: 11px;
  background: rgba(245, 158, 11, 0.09);
  color: #92400e;
}

.config-alert svg { flex: 0 0 auto; margin-top: 1px; }
.config-alert p { margin: 0; font-size: 10px; line-height: 1.5; }
.config-alert code { padding: 1px 4px; border-radius: 4px; background: rgba(146, 64, 14, 0.1); font-size: 9px; }

.auth-tabs {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  padding: 4px;
  margin-bottom: 18px;
  border: 1px solid var(--slate-line);
  border-radius: 14px;
  background: #eef2f7;
}

.tab-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  border: 1px solid rgba(11, 25, 44, 0.05);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 5px 14px rgba(11, 25, 44, 0.1);
  transition: transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-indicator.is-signup { transform: translateX(100%); }

.auth-tabs button {
  position: relative;
  z-index: 1;
  min-height: 35px;
  padding: 7px 6px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #64748b;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: color 180ms ease;
}

.auth-tabs button.active { color: var(--navy); }

.auth-form {
  width: 100%;
  transition: height 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease, transform 260ms ease;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  margin-bottom: 12px;
}

.input-wrap {
  position: relative;
  isolation: isolate;
}

.input-wrap::before {
  position: absolute;
  inset: -1px;
  z-index: -1;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--navy), var(--gold));
  content: '';
  opacity: 0;
  transition: opacity 200ms ease;
}

.input-wrap:focus-within::before { opacity: 1; }

.input-wrap input {
  width: 100%;
  height: 47px;
  padding: 18px 38px 6px 40px;
  border: 1px solid var(--slate-line);
  border-radius: 12px;
  background: #fff;
  color: var(--navy);
  font-family: inherit;
  font-size: 13px;
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.input-wrap input:hover { border-color: #cbd5e1; }

.input-wrap input:focus {
  outline: none;
  border-color: transparent;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.14);
}

.input-wrap label {
  position: absolute;
  top: 16px;
  left: 40px;
  color: #64748b;
  font-size: 12.5px;
  pointer-events: none;
  transform-origin: left top;
  transition: transform 180ms ease, color 180ms ease, font-weight 180ms ease;
}

.input-wrap input:focus + label,
.input-wrap input:not(:placeholder-shown) + label {
  transform: translateY(-10px) scale(0.8);
  color: var(--navy);
  font-weight: 700;
}

.input-icon {
  position: absolute;
  top: 50%;
  left: 13px;
  z-index: 2;
  color: #94a3b8;
  transform: translateY(-50%);
  pointer-events: none;
  transition: color 180ms ease;
}

.input-wrap:focus-within .input-icon { color: var(--navy); }

.field.has-error .input-wrap input {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.03);
}

.field.has-error .input-wrap input:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12); }

.field.is-shaking .input-wrap { animation: fieldShake 380ms ease; }

.valid-check,
.match-check {
  position: absolute;
  top: 50%;
  right: 13px;
  z-index: 2;
  color: #059669;
  transform: translateY(-50%);
  animation: checkIn 220ms ease both;
}

.field-action {
  position: absolute;
  top: 50%;
  right: 8px;
  z-index: 3;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  transform: translateY(-50%);
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: color 180ms ease, background 180ms ease;
}

.field-action:hover {
  color: var(--navy);
  background: rgba(11, 25, 44, 0.07);
}

.field-error,
.field-success,
.field-hint {
  margin: 5px 2px 0;
  font-size: 10px;
  line-height: 1.4;
}

.field-error { color: #dc2626; font-weight: 650; }
.field-success { display: flex; align-items: center; gap: 5px; color: #059669; font-weight: 650; }
.field-hint { color: #64748b; }

.domain-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 7px 0 0 2px;
}

.domain-chip {
  padding: 4px 8px;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 999px;
  background: rgba(212, 175, 55, 0.08);
  color: #7a5f10;
  font-family: inherit;
  font-size: 9px;
  font-weight: 750;
  cursor: pointer;
  transition: background 160ms ease, transform 160ms ease, border-color 160ms ease;
}

.domain-chip:hover {
  border-color: rgba(212, 175, 55, 0.6);
  background: rgba(212, 175, 55, 0.16);
  transform: translateY(-1px);
}

.field-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: -2px 2px 12px;
}

.remember-me {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--slate-text);
  font-size: 11px;
  font-weight: 650;
  cursor: pointer;
  user-select: none;
}

.remember-me input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--gold);
  cursor: pointer;
}

.text-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--navy);
  font-family: inherit;
  font-size: 11px;
  font-weight: 750;
  text-decoration: none;
  cursor: pointer;
  transition: color 160ms ease;
}

.text-link:hover { color: #8a6d13; }

/* ── COMBOBOX ── */
.combobox-field { position: relative; }

.combo-wrap input { padding-right: 78px; }
.combo-wrap.is-open { z-index: 20; }
.combo-wrap.is-open input { border-color: transparent; }

.dept-badge {
  position: absolute;
  top: 50%;
  right: 38px;
  z-index: 2;
  padding: 3px 6px;
  border-radius: 6px;
  background: rgba(11, 25, 44, 0.07);
  color: var(--navy);
  font-size: 9px;
  font-weight: 800;
  transform: translateY(-50%);
  pointer-events: none;
}

.combo-toggle {
  position: absolute;
  top: 50%;
  right: 8px;
  z-index: 3;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  transform: translateY(-50%);
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: color 180ms ease, transform 180ms ease;
}

.combo-wrap.is-open .combo-toggle { transform: translateY(-50%) rotate(180deg); color: var(--navy); }

.combo-list {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  z-index: 30;
  max-height: 208px;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  border: 1px solid var(--slate-line);
  border-radius: 13px;
  background: #fff;
  box-shadow: 0 18px 38px rgba(11, 25, 44, 0.16);
  list-style: none;
}

.combo-list li {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 36px;
  padding: 7px 9px;
  border-radius: 9px;
  color: #334155;
  font-size: 11px;
  cursor: pointer;
}

.combo-list li.combo-group {
  min-height: 0;
  padding: 7px 9px 4px;
  cursor: default;
}

.combo-group-label {
  color: #8a6d13;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.combo-list li[role='option'].active { background: rgba(11, 25, 44, 0.06); }
.combo-list li[role='option'].selected { color: var(--navy); font-weight: 700; }
.combo-list li[role='option'] svg { margin-left: auto; color: #059669; }

.dept-code {
  min-width: 34px;
  padding: 3px 5px;
  border-radius: 6px;
  background: rgba(212, 175, 55, 0.14);
  color: #7a5f10;
  font-size: 9px;
  font-weight: 800;
  text-align: center;
}

.dept-copy { display: grid; gap: 1px; min-width: 0; }
.dept-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dept-college { color: #94a3b8; font-size: 8px; font-weight: 700; letter-spacing: 0.06em; }
.combo-empty { justify-content: center; color: #94a3b8; cursor: default !important; }

.dropdown-enter-active,
.dropdown-leave-active { transition: opacity 160ms ease, transform 160ms ease; }
.dropdown-enter-from,
.dropdown-leave-to { opacity: 0; transform: translateY(-5px); }

/* ── PASSWORD STRENGTH ── */
.strength {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 8px;
}

.strength-bars {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}

.strength-bars span {
  height: 4px;
  border-radius: 999px;
  background: var(--slate-line);
  transition: background 180ms ease;
}

.strength-weak .strength-bars span.filled { background: #ef4444; }
.strength-fair .strength-bars span.filled { background: var(--gold); }
.strength-strong .strength-bars span.filled { background: #10b981; }

.strength-label {
  min-width: 38px;
  font-size: 9px;
  font-weight: 800;
  text-align: right;
}

.strength-weak .strength-label { color: #dc2626; }
.strength-fair .strength-label { color: #8a6d13; }
.strength-strong .strength-label { color: #059669; }

.req-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 7px 0 0;
  padding: 0;
  list-style: none;
}

.req-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px;
  border: 1px solid var(--slate-line);
  border-radius: 999px;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 700;
  transition: all 180ms ease;
}

.req-pill.met {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.1);
  color: #047857;
}

.req-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

/* ── BUTTONS ── */
.submit-btn {
  position: relative;
  width: 100%;
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin-top: 4px;
  padding: 11px 18px;
  overflow: hidden;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--navy-soft), var(--navy));
  color: #fff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(11, 25, 44, 0.16);
  transition: transform 160ms ease, box-shadow 180ms ease;
}

.submit-btn::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.38), transparent);
  content: '';
  transform: translateX(-100%);
  transition: transform 620ms ease;
}

.submit-btn span,
.submit-btn svg { position: relative; z-index: 1; }

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(11, 25, 44, 0.24);
}

.submit-btn:hover:not(:disabled)::after { transform: translateX(100%); }
.submit-btn:active:not(:disabled) { transform: scale(0.98); }
.submit-btn:disabled { opacity: 0.75; cursor: not-allowed; transform: none; }

.divider {
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 16px 0 12px;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.divider::before,
.divider::after {
  flex: 1;
  height: 1px;
  background: var(--slate-line);
  content: '';
}

.oauth-btn {
  width: 100%;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid var(--slate-line);
  border-radius: 12px;
  background: #fff;
  color: var(--navy);
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.oauth-btn:hover:not(:disabled) {
  border-color: rgba(11, 25, 44, 0.28);
  box-shadow: 0 9px 20px rgba(11, 25, 44, 0.09);
  transform: translateY(-2px);
}

.oauth-btn:active:not(:disabled) { transform: scale(0.98); }
.oauth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.google-icon { width: 16px; height: 16px; flex: 0 0 auto; }

.workspace-footer {
  position: absolute;
  bottom: 12px;
  margin: 0;
  color: #94a3b8;
  font-size: 9px;
  text-align: center;
}

.workspace-footer span { margin-inline: 4px; color: #8a6d13; }

.spin { animation: spin 700ms linear infinite; }

@keyframes fieldShake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

@keyframes checkIn {
  from { opacity: 0; transform: translateY(-50%) scale(0.6); }
  to { opacity: 1; transform: translateY(-50%) scale(1); }
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── HELP WIDGET ── */
.help-widget {
  position: fixed;
  right: clamp(14px, 2vw, 26px);
  bottom: clamp(14px, 2vw, 24px);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.help-popover {
  width: min(286px, calc(100vw - 32px));
  padding: 12px;
  border: 1px solid var(--slate-line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 20px 46px rgba(11, 25, 44, 0.18);
  backdrop-filter: blur(14px);
}

.help-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 4px 10px;
  border-bottom: 1px solid var(--slate-line);
}

.help-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 10px;
  background: rgba(11, 25, 44, 0.08);
  color: var(--navy);
  font-size: 15px;
  font-weight: 800;
}

.help-heading > span:last-child { display: grid; gap: 2px; }
.help-heading strong { font-size: 12px; }
.help-heading small { color: #64748b; font-size: 9px; }

.help-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px;
  border-radius: 11px;
  color: inherit;
  text-decoration: none;
  transition: background 160ms ease;
}

.help-link:hover { background: rgba(11, 25, 44, 0.07); }

.help-link-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 9px;
  background: #f1f5f9;
  color: var(--navy);
  font-size: 12px;
  font-weight: 800;
}

.help-link > span:nth-child(2) { display: grid; gap: 2px; }
.help-link strong { font-size: 11px; }
.help-link small { color: #64748b; font-size: 9px; }

.help-trigger {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 50%;
  background: var(--navy);
  color: var(--gold-light);
  font-family: var(--font-display, Georgia, serif);
  font-size: 18px;
  box-shadow: 0 10px 24px rgba(11, 25, 44, 0.26);
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease;
}

.help-trigger:hover { transform: translateY(-2px) rotate(4deg); background: var(--navy-soft); }

.pop-enter-active,
.pop-leave-active {
  transform-origin: bottom right;
  transition: opacity 160ms ease, transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pop-enter-from,
.pop-leave-to { opacity: 0; transform: translateY(8px) scale(0.94); }

/* ── RESPONSIVE ── */
@media (max-width: 1180px) {
  .showcase-body { grid-template-columns: 1fr; }
  .showcase-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .glass-card { flex-direction: column; align-items: flex-start; }
  .showcase-rotator { display: none; }
}

@media (max-width: 1023px) {
  .auth-page { padding: 0; }

  .auth-shell {
    width: 100%;
    height: auto;
    min-height: 100dvh;
    grid-template-columns: 1fr;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .auth-showcase { display: none; }

  .auth-workspace {
    display: block;
    overflow: visible;
    padding: 28px 16px 56px;
    background: linear-gradient(180deg, var(--navy) 0 112px, var(--slate-bg) 112px);
  }

  .auth-card {
    width: min(100%, 560px);
    margin: 0 auto;
    padding: 24px 22px;
    border: 1px solid var(--slate-line);
    border-radius: 22px;
    background: #fff;
    box-shadow: 0 20px 44px rgba(11, 25, 44, 0.12);
  }

  .auth-card::before { left: 22px; right: 22px; }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 22px;
  }

  .mobile-brand .brand-crest { width: 34px; height: 34px; color: var(--navy); }
  .mobile-brand-copy { display: grid; gap: 2px; color: var(--navy); }
  .mobile-brand-copy strong { font-family: var(--font-display, Georgia, serif); font-size: 13px; }
  .mobile-brand-copy small { color: #64748b; font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase; }
  .mobile-brand .badge-compact { margin-left: auto; }

  .auth-heading { margin-top: 18px; }
  .workspace-footer { position: static; margin-top: 24px; }
}

@media (max-width: 560px) {
  .auth-workspace { padding-inline: 12px; }
  .auth-card { padding: 20px 16px; border-radius: 18px; }
  .field-grid { grid-template-columns: 1fr; gap: 0; }
  .showcase-cards { grid-template-columns: 1fr; }
  .mobile-brand .badge-compact { display: none; }
  .domain-chip { font-size: 8px; }
}

@media (max-height: 760px) and (min-width: 1024px) {
  .auth-shell { min-height: 600px; }
  .showcase-rotator { display: none; }
  .auth-workspace { padding-top: 18px; padding-bottom: 36px; }
  .auth-heading { margin-bottom: 12px; }
  .auth-tabs { margin-bottom: 14px; }
  .field { margin-bottom: 10px; }
}

@media (prefers-reduced-motion: reduce) {
  .crest-ring,
  .crest-art,
  .glass-card,
  .badge-pulse::after,
  .spin,
  .field.is-shaking .input-wrap {
    animation: none !important;
  }

  .tab-indicator,
  .auth-form,
  .rotate-enter-active,
  .rotate-leave-active,
  .dropdown-enter-active,
  .dropdown-leave-active,
  .pop-enter-active,
  .pop-leave-active {
    transition-duration: 1ms !important;
  }
}
</style>
