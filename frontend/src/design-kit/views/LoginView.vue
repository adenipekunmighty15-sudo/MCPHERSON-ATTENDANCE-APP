<template>
  <div class="dk-login">
    <div class="dk-login__brand">
      <div class="dk-login__crest">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect width="48" height="48" rx="12" fill="var(--color-brass)"/>
          <path d="M12 24l8 8 16-16" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 class="dk-login__title">McPherson<br />Attendance</h1>
      <p class="dk-login__subtitle">Smart campus attendance tracking</p>
    </div>
    <div class="dk-login__form">
      <div class="dk-login__card">
        <h2 class="dk-login__heading">Sign in</h2>
        <p class="dk-login__desc">Use your school email to continue</p>
        <form @submit.prevent="handleLogin">
          <label class="dk-login__field">
            <span>Email</span>
            <input v-model="email" type="email" placeholder="you@mcpherson.edu" required class="dk-login__input" />
          </label>
          <label class="dk-login__field">
            <span>Password</span>
            <input v-model="password" type="password" placeholder="••••••••" required class="dk-login__input" />
          </label>
          <BaseButton variant="primary" block :loading="loading" class="dk-login__submit">Sign In</BaseButton>
        </form>
        <p class="dk-login__foot">
          Don't have an account?
          <a href="#" class="dk-login__link">Sign up</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseButton from '../components/BaseButton.vue'

const email = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  await new Promise(r => setTimeout(r, 800))
  loading.value = false
}
</script>

<style scoped>
.dk-login {
  display: flex;
  min-height: 100vh;
  background: var(--color-parchment-500);
}
.dk-login__brand {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background: linear-gradient(135deg, var(--color-ink-900) 0%, var(--color-ink-700) 100%);
  color: var(--color-parchment-100);
}
.dk-login__crest { margin-bottom: 24px; }
.dk-login__title {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
  margin: 0 0 8px;
}
.dk-login__subtitle { font-size: 14px; opacity: 0.7; margin: 0; }
.dk-login__form {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}
.dk-login__card {
  width: 100%;
  max-width: 380px;
}
.dk-login__heading {
  font-family: var(--font-display);
  font-size: 24px;
  margin: 0 0 4px;
  color: var(--color-ink-900);
}
.dk-login__desc { font-size: 14px; color: var(--color-ink-400); margin: 0 0 24px; }
.dk-login__field {
  display: block;
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-ink-700);
}
.dk-login__input {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 10px 14px;
  font-family: var(--font-sans);
  font-size: 14px;
  border: 1px solid var(--color-ink-200);
  border-radius: 8px;
  background: var(--color-parchment-100);
  color: var(--color-ink-900);
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.dk-login__input:focus { outline: none; border-color: var(--color-brass); box-shadow: 0 0 0 3px var(--color-brass-soft); }
.dk-login__submit { margin-top: 8px; }
.dk-login__foot { text-align: center; font-size: 13px; color: var(--color-ink-400); margin-top: 20px; }
.dk-login__link { color: var(--color-brass); text-decoration: none; font-weight: 600; }
.dk-login__link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .dk-login { flex-direction: column; }
  .dk-login__brand { padding: 32px 20px; min-height: 240px; }
  .dk-login__title { font-size: 28px; }
  .dk-login__form { padding: 24px 20px; }
}
</style>
