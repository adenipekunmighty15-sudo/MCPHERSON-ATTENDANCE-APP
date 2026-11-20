import Link from 'next/link'
import NotFoundActions, { RoleAwareNotFound } from '@/components/auth/RoleAwareNotFound'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5 text-center text-navy">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue">404 · Page not found</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Nothing here, yet.</h1>
        <RoleAwareNotFound />
        <NotFoundActions />
        <Link href="/welcome" className="mt-6 block text-xs font-semibold text-navy/50 hover:text-navy">
          Back to the McPherson University home page
        </Link>
      </div>
    </main>
  )
}
