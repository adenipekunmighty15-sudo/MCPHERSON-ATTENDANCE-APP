'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { getSupabaseClient } from '@/lib/supabase'
import type { Session } from '@/lib/types'

function parseHashTokens(): { access_token: string; refresh_token: string } | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  return access_token && refresh_token ? { access_token, refresh_token } : null
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const { ready, adoptSession } = useAuth()

  useEffect(() => {
    let active = true

    const completeSignIn = async () => {
      try {
        await ready
        const supabase = await getSupabaseClient()
        if (!supabase) {
          if (active) router.replace('/login')
          return
        }

        let session: Session | null = null

        // PKCE and several OAuth providers redirect with ?code=... instead of
        // hash tokens; without the exchange the callback can never resolve.
        const code = new URLSearchParams(window.location.search).get('code')
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error) session = data.session
        }

        // Implicit-flow redirects carry the tokens in the URL hash.
        if (!session) {
          const tokens = parseHashTokens()
          if (tokens) {
            const { data, error } = await supabase.auth.setSession(tokens)
            if (!error) session = data.session
          }
        }

        if (!session?.user) {
          const { data } = await supabase.auth.getSession()
          session = data.session
        }

        if (!active) return
        if (session?.user) {
          adoptSession(session)
          router.replace('/')
        } else {
          router.replace('/login')
        }
      } catch (error) {
        console.error('[auth] Callback failed:', error instanceof Error ? error.message : error)
        if (active) router.replace('/login')
      }
    }

    void completeSignIn()
    return () => {
      active = false
    }
  }, [ready, adoptSession, router])

  return (
    <main className="grid min-h-screen place-items-center bg-paper text-navy">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-navy/15 border-t-blue" aria-hidden="true" />
        <p className="mt-5 text-sm font-medium text-navy/60" role="status">Completing sign in…</p>
      </div>
    </main>
  )
}
