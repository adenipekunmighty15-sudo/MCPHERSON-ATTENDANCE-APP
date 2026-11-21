import Link from 'next/link'
import AuthGuard from '@/components/auth/AuthGuard'

export default function DashboardPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-paper px-5 py-12 text-navy sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue">Student portal</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Your dashboard</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-navy/60">
            You are signed in. The full attendance workspace is being migrated into this app; the legacy portal remains available meanwhile.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/chat" className="mcu-action mcu-action--primary">
              Open AI chat
            </Link>
            <Link href="/" className="mcu-action border border-navy/15 bg-white text-navy">
              Go to the portal home
            </Link>
            <Link href="/welcome" className="mcu-action border border-navy/15 bg-white text-navy">
              University home
            </Link>
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}
