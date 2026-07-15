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

    const hashParams = parseHashParams(window.location.hash)
    if (hashParams.access_token && hashParams.refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token: hashParams.access_token,
        refresh_token: hashParams.refresh_token,
      })
      if (!error && data?.session) session = data.session
    }

    if (!session?.user) {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.user) session = data.session
    }

    if (!session?.user) {
      session = await new Promise((resolve) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && newSession?.user) {
            subscription?.unsubscribe()
            resolve(newSession)
          }
        })
        setTimeout(() => {
          subscription?.unsubscribe()
          resolve(null)
        }, 5000)
      })
    }

    if (session?.user) {
      const supaUser = session.user
      const meta = supaUser.user_metadata || {}
      // Store session in auth store so API calls work
      authStore.session = session
      authStore.user = authStore.buildUser ? authStore.buildUser(supaUser) : {
        id: supaUser.id,
        email: supaUser.email || '',
        name: meta.name || meta.full_name || supaUser.email?.split('@')[0]?.replace(/[._]/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || 'User',
        role: meta.role || 'student',
        department: meta.department || 'Computer Science',
        avatar: meta.name?.charAt(0)?.toUpperCase() || supaUser.email?.charAt(0)?.toUpperCase() || 'U',
        isGuest: false,
        provider: supaUser.app_metadata?.provider || 'google',
      }
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        await fetch(apiUrl + '/auth/create-user-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (session.access_token || '') },
          body: JSON.stringify({
            userId: supaUser.id, email: supaUser.email,
            name: meta.name || meta.full_name || supaUser.email?.split('@')[0] || 'User',
            role: 'student', department: 'Computer Science', provider: supaUser.app_metadata?.provider || 'google',
          }),
        })
      } catch (e) {
        console.warn('AuthCallback profile creation failed:', e?.message)
      }
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
  background: linear-gradient(135deg, #1D4ED8 0%, #F59E0B 50%, #DC2626 100%);
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
