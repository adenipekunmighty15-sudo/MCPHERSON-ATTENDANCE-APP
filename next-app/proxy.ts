import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase sessions live in browser storage, so this proxy deliberately
 * does not attempt to read them (that would block valid users server-side).
 * Legacy shortcuts are redirected; client-side guards enforce auth/admin.
 * The dashboard is a real portal page and must never bounce to the landing page.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, '') || '/'

  if (pathname === '/admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/portal/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/'],
}
