export async function resendSignupConfirmation(
  email,
  {
    supabaseUrl = process.env.VITE_SUPABASE_URL,
    anonKey = process.env.VITE_SUPABASE_ANON_KEY,
    fetchImpl = fetch,
  } = {},
) {
  if (!supabaseUrl || !anonKey) {
    return { configured: false, ok: false, status: 0 }
  }

  const response = await fetchImpl(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/resend`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'signup', email }),
  })

  return {
    configured: true,
    ok: response.ok,
    status: response.status,
  }
}
