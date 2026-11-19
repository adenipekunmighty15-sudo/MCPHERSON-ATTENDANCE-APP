<template>
  <div class="page-wide" style="display:flex;align-items:center;justify-content:center;min-height:80vh;padding:24px;">
    <div class="card" style="max-width:480px;width:100%;padding:40px;">
      <h1 class="fp-title">Choose a new password</h1>
      <p class="fp-desc">Enter a new password for your account.</p>
      <p v-if="checking" class="fp-desc">Verifying your reset link…</p>
      <template v-else-if="validLink">
        <div v-if="success" class="fp-success" role="status">Your password has been updated. You can now sign in.</div>
        <div v-if="error" class="fp-error" role="alert">{{ error }}</div>
        <form v-if="!success" @submit.prevent="handleUpdate">
          <div class="form-group" style="margin-bottom:20px;text-align:left;">
            <label class="fp-label" for="new-password">New password</label>
            <input id="new-password" v-model="password" type="password" class="input" autocomplete="new-password" minlength="6" required />
          </div>
          <div class="form-group" style="margin-bottom:20px;text-align:left;">
            <label class="fp-label" for="confirm-password">Confirm password</label>
            <input id="confirm-password" v-model="confirmation" type="password" class="input" autocomplete="new-password" minlength="6" required />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="saving" style="width:100%;">
            {{ saving ? 'Updating…' : 'Update Password' }}
          </button>
        </form>
      </template>
      <template v-else>
        <p class="fp-error" role="alert">{{ error || 'This password reset link is invalid or has expired.' }}</p>
        <router-link to="/forgot-password" class="fp-back-link">Request another link</router-link>
      </template>
      <router-link to="/login" class="fp-back-link">Back to Sign In</router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase, supabaseConfigured } from '../lib/supabase'

const authStore = useAuthStore()
const checking = ref(true)
const validLink = ref(false)
const saving = ref(false)
const success = ref(false)
const password = ref('')
const confirmation = ref('')
const error = ref('')
let authListener

function isRecoveryUrl() {
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.slice(1))
  return query.has('code') || query.get('type') === 'recovery' || hash.get('type') === 'recovery'
}

onMounted(async () => {
  await authStore.ready
  if (!supabase || !supabaseConfigured) {
    error.value = 'Password reset is currently unavailable. Please try again shortly.'
    checking.value = false
    return
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' && session?.user) validLink.value = true
  })
  authListener = subscription

  // Newer Supabase recovery links arrive with ?code=... and must be exchanged
  // before getSession()/updateUser() will have a recovery session to use.
  const code = new URLSearchParams(window.location.search).get('code')
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) console.warn('[reset] Code exchange failed:', exchangeError.message)
  }

  const { data: { session } } = await supabase.auth.getSession()
  validLink.value = !!session?.user && (isRecoveryUrl() || authStore.isAuthenticated)
  checking.value = false
  if (!validLink.value) error.value = 'This password reset link is invalid or has expired.'
})

onUnmounted(() => authListener?.unsubscribe())

async function handleUpdate() {
  error.value = ''
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  if (password.value !== confirmation.value) {
    error.value = 'Passwords do not match.'
    return
  }

  saving.value = true
  try {
    await authStore.updatePassword(password.value)
    success.value = true
    await authStore.logout()
  } catch (err) {
    error.value = err?.message || 'Unable to update your password. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.fp-title { font-size: 22px; font-weight: 800; color: var(--color-text-primary); margin: 0 0 8px; }
.fp-desc { color: var(--color-text-secondary); font-size: 14px; margin: 0 0 24px; line-height: 1.6; }
.fp-success { padding: 16px; background: rgba(34, 197, 94, 0.1); border-radius: 12px; color: var(--color-success); font-weight: 600; font-size: 14px; margin-bottom: 16px; }
.fp-error { padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 12px; color: var(--color-error); font-size: 14px; margin-bottom: 16px; }
.fp-label { display: block; font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 6px; }
.fp-back-link { display: block; margin-top: 16px; font-size: 13px; font-weight: 600; color: var(--color-primary); text-decoration: none; text-align: center; }
</style>
