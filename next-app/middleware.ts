import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase sessions live in browser storage, so this middleware deliberately
 * does not attempt to read them (that would block valid users server-side).
 * Legacy shortcuts are redirected; client-side guards enforce auth/admin.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, '') || '/'

  if (pathname === '/dashboard') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (pathname === '/admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/portal/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/dashboard/', '/admin', '/admin/'],
}
