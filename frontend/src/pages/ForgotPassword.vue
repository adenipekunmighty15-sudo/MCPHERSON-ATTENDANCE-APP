<template>
  <div class="page-container" style="display:flex;align-items:center;justify-content:center;min-height:60vh;">
    <div class="card" style="max-width:460px;width:100%;padding:40px;text-align:center;">
      <div class="fp-icon-wrapper">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <h1 class="fp-title">Reset Password</h1>
      <p class="fp-desc">Enter your email address and we'll send you a link to reset your password.</p>
      <div v-if="sent" class="fp-success">
        Reset link sent! Check your email.
      </div>
      <form @submit.prevent="handleReset">
        <div class="form-group" style="margin-bottom:20px;text-align:left;">
          <label class="fp-label">Email</label>
          <input v-model="email" type="email" class="input" placeholder="you@mcu.edu.ng" required />
        </div>
        <button type="submit" class="btn btn-primary" :disabled="sending" style="width:100%;">
          <span v-if="sending">Sending...</span>
          <span v-else>Send Reset Link</span>
        </button>
      </form>
      <router-link to="/login" class="fp-back-link">Back to Sign In</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const sending = ref(false)
const sent = ref(false)

async function handleReset() {
  sending.value = true
  await new Promise(r => setTimeout(r, 1000))
  sent.value = true
  sending.value = false
}
</script>

<style scoped>
.fp-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}
.fp-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}
.fp-desc {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin: 0 0 24px;
  line-height: 1.6;
}
.fp-success {
  padding: 16px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 12px;
  color: var(--color-success);
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 16px;
}
.fp-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}
.fp-back-link {
  display: block;
  margin-top: 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
}
</style>
