<template>
  <div class="min-h-screen w-full flex items-stretch relative overflow-hidden font-sans" :class="themeClass">
    <!-- Glass-morphism background with decorative orbs -->
    <div class="absolute inset-0 z-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[var(--color-primary)]/8 via-[var(--color-accent)]/5 to-transparent rounded-full blur-[120px]" />
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[var(--color-primary-light)]/6 via-[var(--color-primary)]/4 to-transparent rounded-full blur-[100px]" />
      <div class="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-r from-[var(--color-accent)]/3 to-transparent rounded-full blur-[80px]" />
    </div>

    <!-- Left Panel - Brand -->
    <div class="hidden lg:flex w-1/2 relative z-10 flex-col justify-center px-16 py-12">
      <div class="max-w-lg">
        <div class="flex items-center gap-3 mb-12">
          <div class="w-12 h-12 rounded-xl card flex items-center justify-center" style="background:var(--color-primary-soft)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-primary)">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 3.6 3 6 3s6-1.9 6-3v-5"/>
            </svg>
          </div>
          <div>
            <span class="text-[var(--color-text-primary)] font-bold text-lg tracking-tight">McPherson University</span>
            <p class="text-[var(--color-text-tertiary)] text-xs">Citadel of Champions</p>
          </div>
        </div>

        <h1 class="h1 tracking-tighter mb-4">
          <span class="login-gradient-text">Sign Up</span>
        </h1>
        <p class="text-[var(--color-text-tertiary)] font-light mb-8 max-w-md leading-relaxed">
          Join the McPherson community and unlock access to attendance tracking, study materials, and AI-powered insights.
        </p>

        <div class="relative pl-6 border-l-[3px] border-[var(--color-primary)]/30">
          <p class="text-[var(--color-text-primary)] italic leading-relaxed text-sm">&ldquo;The future belongs to those who believe in the beauty of their dreams.&rdquo;</p>
          <p class="text-[var(--color-text-tertiary)] text-xs mt-2 font-medium">&mdash; Eleanor Roosevelt</p>
        </div>

        <div class="flex flex-wrap gap-2 mt-10">
          <span class="feature-pill">Attendance Tracking</span>
          <span class="feature-pill">AI Council</span>
          <span class="feature-pill">Study Hub</span>
          <span class="feature-pill">Live Sessions</span>
        </div>
      </div>
    </div>

    <!-- Right Panel - Auth Card -->
    <div class="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-6">
      <div class="w-full max-w-sm">
        <div class="lg:hidden flex items-center gap-3 mb-8">
          <div class="w-9 h-9 rounded-xl card flex items-center justify-center" style="background:var(--color-primary-soft)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-primary)">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 3.6 3 6 3s6-1.9 6-3v-5"/>
            </svg>
          </div>
          <span class="text-[var(--color-text-primary)] font-bold text-base tracking-tight">McPherson University</span>
        </div>

        <div class="relative">
          <div class="absolute -top-[2px] left-6 right-6 h-[3px] bg-[var(--color-primary)] rounded-full" />

          <div class="card card-hover p-8 relative overflow-hidden fade-in">
            <div class="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-[var(--color-primary)]/8 via-[var(--color-accent)]/5 to-transparent blur-[60px] rounded-full pointer-events-none" />
            <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-[var(--color-primary-light)]/6 to-transparent blur-[60px] rounded-full pointer-events-none" />
            <div class="absolute top-0 right-0 w-12 h-12 bg-[var(--color-primary)]/5 clip-corner pointer-events-none" />

            <div class="text-center mb-8 relative">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl card flex items-center justify-center" style="background:var(--color-primary-soft)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--color-primary)">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
                </svg>
              </div>
              <h2 class="h2 text-[var(--color-text-primary)]">Create account</h2>
              <p class="text-sm text-[var(--color-text-tertiary)] mt-1">Join the McPherson community</p>
            </div>

            <form @submit.prevent="handleSignup" class="space-y-5">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Full Name</label>
                <div class="relative group">
                  <div class="relative flex items-center">
                    <div class="absolute left-3.5 w-4 h-4 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-primary)] transition-colors"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <input v-model="name" type="text" placeholder="John Doe" required class="login-input w-full pl-10 pr-4 text-sm py-3" />
                  </div>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Email</label>
                <div class="relative group">
                  <div class="relative flex items-center">
                    <div class="absolute left-3.5 w-4 h-4 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-primary)] transition-colors"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <input v-model="email" type="email" placeholder="you@mcu.edu.ng" required class="login-input w-full pl-10 pr-4 text-sm py-3" />
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Password</label>
                  <div class="relative group">
                    <div class="relative flex items-center">
                      <div class="absolute left-3.5 w-4 h-4 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-primary)] transition-colors"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Min. 6 chars" required class="login-input w-full pl-10 pr-8 text-sm py-3" />
                      <button type="button" @click="showPassword = !showPassword" class="absolute right-3.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors p-1">
                        <svg v-if="!showPassword" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Confirm</label>
                  <div class="relative group">
                    <div class="relative flex items-center">
                      <div class="absolute left-3.5 w-4 h-4 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-[var(--color-text-tertiary)]"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <input v-model="passwordConfirm" :type="showConfirm ? 'text' : 'password'" placeholder="Repeat" required class="login-input w-full pl-10 pr-4 text-sm py-3" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Department</label>
                <div class="relative">
                  <select v-model="department" class="login-input w-full appearance-none pr-8 cursor-pointer pt-3 pb-3 pl-3.5">
                    <option value="" disabled>Select your department</option>
                    <option v-for="d in departments" :key="d.code" :value="d.name">{{ d.name }} ({{ d.code }})</option>
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>

              <div v-if="authStore.error" class="card border-[var(--color-error)]/30 text-[var(--color-error)] text-sm p-3 rounded-lg flex items-start gap-2.5 animate-fade-in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <p>{{ authStore.error }}</p>
              </div>
              <div v-if="passwordError" class="card border-[var(--color-error)]/30 text-[var(--color-error)] text-sm p-3 rounded-lg flex items-start gap-2.5 animate-fade-in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p>{{ passwordError }}</p>
              </div>

              <button type="submit" :disabled="authStore.loading"
                class="btn btn-primary w-full relative overflow-hidden group/btn flex items-center justify-center gap-2 py-3.5 px-4 text-sm"
              >
                <div class="absolute inset-0 bg-[var(--color-primary)]/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                <span class="relative flex items-center justify-center gap-2">
                  <svg v-if="authStore.loading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><circle cx="12" cy="12" r="10" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
                  {{ authStore.loading ? 'Creating account...' : 'Create Account' }}
                </span>
              </button>

              <div class="relative flex items-center py-1">
                <div class="flex-grow border-t border-[var(--color-border)]" />
                <span class="flex-shrink-0 mx-3 text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">or</span>
                <div class="flex-grow border-t border-[var(--color-border)]" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <button type="button" @click="handleOAuth('google')"
                  class="flex items-center justify-center gap-2.5 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:shadow-lg text-[var(--color-text-primary)] py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.97] text-sm font-medium bg-[var(--color-surface)]"
                >
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <span>Google</span>
                </button>
                <button type="button" @click="handleGuest"
                  class="flex items-center justify-center gap-2.5 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:shadow-lg text-[var(--color-text-primary)] py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.97] text-sm font-medium bg-[var(--color-surface)]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="shrink-0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>Guest</span>
                </button>
              </div>
            </form>

            <p class="mt-6 text-center text-xs text-[var(--color-text-tertiary)]">
              Already have an account?
              <router-link to="/login" class="auth-link ml-1 font-semibold">Sign in</router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const passwordError = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const department = ref('')

const departments = [
  { code: 'CSC', name: 'Computer Science' }, { code: 'SWE', name: 'Software Engineering' },
  { code: 'CYS', name: 'Cyber Security' }, { code: 'IFT', name: 'Information Technology' },
  { code: 'DTS', name: 'Data Science' }, { code: 'BCH', name: 'Biochemistry' },
  { code: 'MCB', name: 'Microbiology' }, { code: 'ICH', name: 'Industrial Chemistry' },
  { code: 'PHY', name: 'Physics with Electronics' }, { code: 'STA', name: 'Statistics' },
  { code: 'MLS', name: 'Medical Laboratory Science' }, { code: 'PHT', name: 'Public Health' },
  { code: 'ACC', name: 'Accounting' }, { code: 'BUS', name: 'Business Administration' },
  { code: 'ECO', name: 'Economics' }, { code: 'MAC', name: 'Mass Communication' },
  { code: 'LAW', name: 'Law' }, { code: 'NUR', name: 'Nursing Science' },
  { code: 'ENG', name: 'English and Literary Studies' },
]

onMounted(async () => {
  await authStore.ready
  if (authStore.isAuthenticated) router.push('/')
})

async function handleSignup() {
  passwordError.value = ''
  if (password.value !== passwordConfirm.value) {
    passwordError.value = 'Passwords do not match.'
    return
  }
  if (password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters.'
    return
  }
  try {
    await authStore.signUp(email.value, password.value, {
      name: name.value,
      department: department.value || 'Computer Science',
      role: 'student',
    })
    router.push('/')
  } catch (e) { console.warn('[Signup] Failed:', e) }
}

async function handleOAuth(provider) {
  try { await authStore.signInWithOAuth(provider) } catch (e) { console.warn('[Signup] OAuth failed:', e) }
}

async function handleGuest() {
  try { await authStore.loginAsGuest(); router.push('/') } catch (e) { console.warn('[Signup] Guest failed:', e) }
}

const themeClass = computed(() => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark') ? 'dark' : ''
  }
  return ''
})

</script>

<style scoped>
/* Gradient text for heading */
.login-gradient-text {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 50%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Auth link style */
.auth-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  border-bottom: 2px solid var(--color-primary);
  transition: all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.auth-link:hover {
  border-bottom-width: 4px;
}

/* Feature pill badges */
.feature-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  background: var(--color-surface-elevated);
  border: 2px solid var(--color-border);
  transition: all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.feature-pill:hover {
  color: var(--color-text-primary);
  border-color: var(--color-primary);
  transform: translateX(4px);
}

/* Login input style */
.login-input {
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--color-border);
  padding: 12px 0 12px 36px;
  font-size: 14px;
  color: var(--color-text-primary);
  transition: border-color 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.login-input:focus {
  outline: none;
  border-bottom-color: var(--color-primary);
  border-bottom-width: 3px;
}

.login-input::placeholder {
  color: var(--color-text-tertiary);
  opacity: 0.6;
}

/* Corner clip decoration */
.clip-corner {
  clip-path: polygon(100% 0, 0 0, 100% 100%);
}

[data-theme="dark"] .clip-corner,
.dark .clip-corner {
  opacity: 0.08;
}

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .feature-pill { font-size: 9px; padding: 4px 10px; }
}

@media (max-width: 480px) {
  .feature-pill { display: none; }
  .login-input { font-size: 13px; padding: 10px 0 10px 32px; }
  .clip-corner { display: none; }
}

/* Autofill override */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 30px var(--color-surface) inset !important;
  -webkit-text-fill-color: var(--color-text-primary) !important;
  caret-color: var(--color-text-primary);
  transition: background-color 5000s ease-in-out 0s;
}
</style>
