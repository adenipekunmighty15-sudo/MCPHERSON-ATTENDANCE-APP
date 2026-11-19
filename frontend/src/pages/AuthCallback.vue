<template>
  <div class="auth-callback-page">
    <div class="callback-loader">
      <div class="skeleton-card" style="padding:24px;width:280px"><div class="skeleton-box" style="width:100%;height:14px;margin-bottom:12px"></div><div class="skeleton-box" style="width:70%;height:14px"></div></div>
      <p class="callback-text">Completing sign in...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase, supabaseConfigured } from '../lib/supabase'

const router = useRouter()
const authStore = useAuthStore()

function parseHashParams(hash) {
  const params = {}
  const query = hash.replace(/^#/, '')
  for (const part of query.split('&')) {
    const [key, val] = part.split('=')
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(val || '')
  }
  return params
}

onMounted(async () => {
  try {
    await authStore.ready

    if (!supabase || !supabaseConfigured) {
      router.replace('/login')
      return
    }

    let session = null

    // PKCE and several OAuth providers redirect with ?code=... instead of
    // hash tokens. Without this exchange the callback always timed out.
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error && data?.session) session = data.session
    }

    // Implicit-flow redirects carry tokens in the hash.
    if (!session) {
      const hashParams = parseHashParams(window.location.hash)
      if (hashParams.access_token && hashParams.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: hashParams.access_token,
          refresh_token: hashParams.refresh_token,
        })
        if (!error && data?.session) session = data.session
      }
    }

    if (!session?.user) {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.user) session = data.session
    }

    if (session?.user) {
      authStore.session = session
      authStore.user = authStore.buildUser(session)
      // Role comes from the backend DB; sync it without blocking navigation.
      void authStore.syncProfile()
      router.replace('/')
      return
    }
    router.replace('/login')
  } catch (err) {
    console.error('Auth callback error:', err)
    router.replace('/login')
  }
})
</script>

<style scoped>
.auth-callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
}

.callback-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.callback-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
}
</style>
