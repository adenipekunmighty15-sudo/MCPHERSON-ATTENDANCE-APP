<template>
  <div class="login-page min-h-screen w-full flex items-stretch relative overflow-hidden" style="background: #F5F1EA;">
    <!-- LEFT COLUMN -->
    <div class="hidden lg:flex w-1/2 relative z-10 flex-col justify-center px-16 py-12">
      <div class="max-w-lg">
        <!-- Brand header -->
        <div class="flex items-center gap-3 mb-14">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background: #EDEDED;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 1.1 3.6 3 6 3s6-1.9 6-3v-5"/>
            </svg>
          </div>
          <div>
            <div class="text-[#1A1A2E] font-bold text-base tracking-tight" style="font-family: 'Fraunces', Georgia, serif;">McPherson University</div>
            <div class="text-[#68758E] text-xs mt-0.5">Citadel of Champions</div>
          </div>
        </div>

        <!-- Headline -->
        <h1 class="mb-5 leading-tight" style="font-family: 'Fraunces', Georgia, serif;">
          <div class="text-[#1A1A2E] text-5xl font-bold tracking-tighter">Your campus,</div>
          <div class="text-[#C9902B] text-5xl font-bold tracking-tighter">reimagined.</div>
        </h1>

        <!-- Subtext -->
        <p class="text-[#68758E] text-base leading-relaxed mb-10 max-w-md" style="font-family: 'Inter', system-ui, sans-serif;">
          Track attendance, manage courses, and unlock AI-powered insights — built for McPherson students.
        </p>

        <!-- 2x2 Feature Grid -->
        <div class="grid grid-cols-2 gap-3 mb-12 max-w-md">
          <div class="rounded-xl py-4 px-5" style="background: #EDEDED;">
            <div class="text-[#1A1A2E] text-lg font-bold" style="font-family: 'Fraunces', Georgia, serif;">Check-in</div>
            <div class="text-[#68758E] text-xs mt-1 font-medium">Verified class attendance</div>
          </div>
          <div class="rounded-xl py-4 px-5" style="background: #EDEDED;">
            <div class="text-[#1A1A2E] text-lg font-bold" style="font-family: 'Fraunces', Georgia, serif;">Courses</div>
            <div class="text-[#68758E] text-xs mt-1 font-medium">Keep your timetable organized</div>
          </div>
          <div class="rounded-xl py-4 px-5" style="background: #EDEDED;">
            <div class="text-[#1A1A2E] text-lg font-bold" style="font-family: 'Fraunces', Georgia, serif;">Insights</div>
            <div class="text-[#68758E] text-xs mt-1 font-medium">Review attendance progress</div>
          </div>
          <div class="rounded-xl py-4 px-5" style="background: #EDEDED;">
            <div class="text-[#1A1A2E] text-lg font-bold" style="font-family: 'Fraunces', Georgia, serif;">Your account</div>
            <div class="text-[#68758E] text-xs mt-1 font-medium">Protected sign-in and recovery</div>
          </div>
        </div>

        <!-- Pull-quote -->
        <div class="pl-5" style="border-left: 3px solid #C9902B;">
          <p class="text-[#68758E] italic text-sm leading-relaxed" style="font-family: 'Inter', system-ui, sans-serif;">&ldquo;Education is the most powerful weapon which you can use to change the world.&rdquo;</p>
          <p class="text-[#96A0B5] text-xs mt-2 font-medium">&mdash; Nelson Mandela</p>
        </div>
      </div>
    </div>

    <!-- RIGHT COLUMN -->
    <div class="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-6 lg:p-8">
      <div aria-hidden="true" class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div class="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#C9902B]/10 blur-3xl" />
        <div class="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#0F1E3D]/10 blur-3xl" />
      </div>

      <div class="w-full max-w-sm relative z-10">
        <!-- Mobile logo -->
        <div class="lg:hidden flex items-center gap-3 mb-10">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background: #EDEDED;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 1.1 3.6 3 6 3s6-1.9 6-3v-5"/>
            </svg>
          </div>
          <div>
            <div class="text-[#1A1A2E] font-bold text-sm" style="font-family: 'Fraunces', Georgia, serif;">McPherson University</div>
            <div class="text-[#68758E] text-[10px]">Citadel of Champions</div>
          </div>
        </div>

        <!-- Auth Card -->
        <div class="relative">
          <!-- Gradient top bar -->
          <div class="absolute -top-px left-6 right-6 h-[3px] rounded-full z-10" style="background: linear-gradient(90deg, #0F1E3D, #C9902B);" />

          <!-- Card body -->
          <div class="bg-white rounded-[20px] p-8 relative overflow-hidden" style="box-shadow: 0 16px 40px rgba(11, 26, 51, 0.08), 0 8px 16px rgba(11, 26, 51, 0.04);">
            <!-- Tab Switcher -->
            <div class="flex p-1 mb-7 rounded-xl" style="background: #EDEDED;">
              <router-link to="/login" class="flex-1 py-2.5 px-4 text-sm font-semibold rounded-[10px] transition-all duration-200 text-center" style="font-family: 'Inter', system-ui, sans-serif; background: #FFFFFF; color: #1A1A2E; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">Sign In</router-link>
              <router-link to="/signup" class="flex-1 py-2.5 px-4 text-sm font-semibold rounded-[10px] transition-all duration-200 text-center" style="font-family: 'Inter', system-ui, sans-serif; background: transparent; color: #96A0B5;">Create Account</router-link>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleLogin" novalidate class="space-y-5">
              <!-- Email -->
              <div class="space-y-1.5">
                <label for="login-email" class="text-[10px] font-semibold text-[#68758E] uppercase tracking-wider" style="font-family: 'Inter', system-ui, sans-serif;">Email</label>
                <input id="login-email" v-model="email" type="email" placeholder="you@mcu.edu.ng" autocomplete="email"
                  class="w-full text-sm rounded-xl px-4 py-3.5 border-0 outline-none transition-all duration-200"
                  style="background: #EDEDED; color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;"
                  @focus="$el.style.boxShadow = '0 0 0 2px #C9902B'"
                  @blur="$el.style.boxShadow = 'none'"
                />
              </div>

              <!-- Password -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label for="login-password" class="text-[10px] font-semibold text-[#68758E] uppercase tracking-wider" style="font-family: 'Inter', system-ui, sans-serif;">Password</label>
                  <router-link to="/forgot-password" class="text-[11px] font-medium transition-colors" style="color: #0F1E3D; font-family: 'Inter', system-ui, sans-serif;">Forgot?</router-link>
                </div>
                <div class="relative">
                  <input id="login-password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Enter your password" autocomplete="current-password"
                    class="w-full text-sm rounded-xl px-4 py-3.5 border-0 outline-none transition-all duration-200 pr-11"
                    style="background: #EDEDED; color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;"
                    @focus="$el.style.boxShadow = '0 0 0 2px #C9902B'"
                    @blur="$el.style.boxShadow = 'none'"
                  />
                  <button type="button" @click="showPassword = !showPassword" class="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 transition-colors" style="color: #96A0B5;">
                    <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
              </div>

              <!-- Error -->
              <div v-if="authStore.error" class="flex items-start gap-2.5 text-sm p-3 rounded-xl animate-fade-in" style="background: rgba(196,30,30,0.08); color: #C41E1E; font-family: 'Inter', system-ui, sans-serif;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <p>{{ authStore.error }}</p>
              </div>

              <!-- Submit -->
              <button type="submit" :disabled="authStore.loading"
                class="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 border-0 cursor-pointer"
                style="background: #0F1E3D; font-family: 'Inter', system-ui, sans-serif;"
                @mouseenter="$el.style.background = '#1A2D52'"
                @mouseleave="$el.style.background = '#0F1E3D'"
              >
                <svg v-if="authStore.loading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><circle cx="12" cy="12" r="10" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                <template v-else>Sign In &rarr;</template>
              </button>

              <!-- Divider -->
              <div class="relative flex items-center py-1">
                <div class="flex-grow border-t" style="border-color: #E2E6ED;" />
                <span class="flex-shrink-0 mx-3 text-[10px] font-semibold uppercase tracking-wider" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">or</span>
                <div class="flex-grow border-t" style="border-color: #E2E6ED;" />
              </div>

              <!-- Secondary buttons -->
              <div class="grid grid-cols-1 gap-3">
                <button type="button" @click="handleOAuth('google')"
                  class="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97] border-0 cursor-pointer"
                  style="background: #EDEDED; color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;"
                  @mouseenter="$el.style.background = '#E2E6ED'"
                  @mouseleave="$el.style.background = '#EDEDED'"
                >
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <span>Google</span>
                </button>
              </div>
            </form>

            <!-- Sign up link -->
            <p class="mt-7 text-center text-xs" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">
              Don&apos;t have an account?
              <router-link to="/signup" class="font-semibold transition-colors" style="color: #0F1E3D;">Create one</router-link>
            </p>
          </div>

          <!-- Security caption -->
          <p class="text-center text-[11px] mt-5" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">Protected by McPherson University IT Security</p>
        </div>
      </div>

      <!-- Floating help button -->
      <div class="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-2">
        <div v-if="helpOpen" role="status" class="max-w-[260px] rounded-xl bg-white px-4 py-3 text-xs leading-relaxed shadow-lg" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">
          Can't sign in? Contact ICT Support at
          <a href="mailto:ict@mcu.edu.ng" class="font-semibold underline" style="color: #0F1E3D;">ict@mcu.edu.ng</a>.
        </div>
        <button type="button" :aria-expanded="helpOpen" aria-label="Help and support contact"
          class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-0 cursor-pointer transition-all duration-200"
          style="background: #EDEDED; color: #68758E; box-shadow: 0 4px 12px rgba(0,0,0,0.06);"
          @click="helpOpen = !helpOpen"
          @mouseenter="$el.style.background = '#E2E6ED'" @mouseleave="$el.style.background = '#EDEDED'">?</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const helpOpen = ref(false)

onMounted(async () => {
  await authStore.ready
  if (authStore.isAuthenticated) router.push('/')
})

async function handleLogin() {
  if (!email.value.trim() || !password.value) {
    authStore.error = 'Enter both your email and password.'
    return
  }
  try {
    await authStore.signIn(email.value.trim(), password.value)
    const redirect = router.currentRoute.value.query.redirect
    router.push(typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('/login') ? redirect : '/')
  } catch (e) { console.warn('[Login] Sign in failed:', e) }
}

async function handleOAuth(provider) {
  try {
    await authStore.signInWithOAuth(provider)
  } catch (e) {
    console.error('OAuth error:', e)
  }
}

</script>

<style>
.login-page {
  min-height: 100dvh;
}

.login-page input::placeholder {
  color: #96A0B5;
  opacity: 0.7;
}

.login-page input:-webkit-autofill,
.login-page input:-webkit-autofill:hover,
.login-page input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 30px #EDEDED inset !important;
  -webkit-text-fill-color: #1A1A2E !important;
  caret-color: #1A1A2E;
  transition: background-color 5000s ease-in-out 0s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@media (max-width: 1024px) {
  .login-page .fixed.bottom-6.right-6 {
    bottom: 80px;
  }
}
</style>
