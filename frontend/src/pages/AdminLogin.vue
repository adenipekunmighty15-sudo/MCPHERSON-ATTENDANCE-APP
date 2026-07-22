<template>
  <div class="admin-login-page">
    <div class="admin-bg">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="bg-orb orb-3"></div>
    </div>
    <div class="login-container">
      <div class="login-card">
        <div class="card-header">
          <div class="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 class="header-title">Admin Portal</h1>
          <p class="header-subtitle">MCU Attendance Management</p>
        </div>
        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="admin-email">Email</label>
            <input id="admin-email" v-model="email" type="email" placeholder="you@mcpherson.edu" required autocomplete="email" class="form-input" :disabled="loading" />
          </div>
          <div class="form-group">
            <label for="admin-password">Password</label>
            <input id="admin-password" v-model="password" type="password" placeholder="Enter password" required autocomplete="current-password" class="form-input" :disabled="loading" />
          </div>
          <p v-if="error" class="form-error">{{ error }}</p>
          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Sign In</span>
          </button>
        </form>
        <div class="card-footer">
          <router-link to="/login" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Student Portal
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template><script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await authStore.signIn(email.value, password.value)
    const role = authStore.user?.role || 'student'
    if (role === 'admin' || role === 'super_admin') {
      router.push('/admin/portal/dashboard')
    } else {
      error.value = 'Access denied. Admin credentials required.'
      await authStore.logout()
    }
  } catch (err) {
    error.value = err.message || 'Invalid email or password'
  } finally {
    loading.value = false
  }
}
</script><style scoped>
.admin-login-page { min-height: 100dvh; display: flex; align-items: center; justify-content: center; background: var(--color-bg); position: relative; overflow: hidden; padding: 20px; font-family: 'Inter', system-ui, sans-serif; }
.admin-bg { position: fixed; inset: 0; overflow: hidden; pointer-events: none; }
.bg-orb { position: absolute; border-radius: 50%; filter: blur(120px); }
.orb-1 { top: -20%; left: -10%; width: 50%; height: 50%; background: radial-gradient(circle, rgba(30,64,175,0.15), transparent 70%); animation: float1 20s ease-in-out infinite; }
.orb-2 { bottom: -15%; right: -10%; width: 40%; height: 40%; background: radial-gradient(circle, rgba(217,119,6,0.1), transparent 70%); animation: float2 25s ease-in-out infinite reverse; }
.orb-3 { top: 50%; left: 50%; width: 30%; height: 30%; background: radial-gradient(circle, rgba(37,99,235,0.08), transparent 70%); animation: float1 22s ease-in-out infinite 5s; }
@keyframes float1 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(40px,-50px) scale(1.1); } 66% { transform: translate(-30px,30px) scale(0.9); } }
@keyframes float2 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(-40px,50px) scale(1.05); } 66% { transform: translate(30px,-30px) scale(0.95); } }
.login-container { width: 100%; max-width: 420px; position: relative; z-index: 1; }
.login-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 24px; padding: 40px 36px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
.card-header { text-align: center; margin-bottom: 32px; }
.header-icon { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: linear-gradient(135deg, var(--color-primary), #1e40af); color: #fff; border-radius: 16px; margin-bottom: 16px; }
.header-title { font-size: 24px; font-weight: 800; color: var(--color-text-primary); margin: 0 0 4px; font-family: 'Fraunces', Georgia, serif; }
.header-subtitle { font-size: 14px; color: var(--color-text-tertiary); margin: 0; }
.login-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
.form-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text-primary); font-size: 14px; transition: border-color 0.2s; outline: none; box-sizing: border-box; font-family: inherit; }
.form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
.form-input:disabled { opacity: 0.5; cursor: not-allowed; }
.form-error { color: var(--color-error); font-size: 13px; margin: 0; text-align: center; }
.submit-btn { width: 100%; padding: 12px; border-radius: 12px; background: var(--color-primary); color: #fff; font-size: 15px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.submit-btn:hover:not(:disabled) { background: var(--color-primary-hover); transform: translateY(-1px); box-shadow: 0 4px 12px var(--color-primary-glow); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.card-footer { text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--color-border); }
.back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-text-tertiary); text-decoration: none; font-size: 13px; font-weight: 500; transition: color 0.2s; }
.back-link:hover { color: var(--color-primary); }
@media (max-width: 480px) { .login-card { padding: 28px 24px; } }
</style>
