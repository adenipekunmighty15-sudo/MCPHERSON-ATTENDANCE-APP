import Link from 'next/link'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminPage() {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-paper px-5 py-12 text-navy sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue">Administration</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Admin portal</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-navy/60">
            Administrator access confirmed. The attendance management screens are being migrated into this app.
          </p>
          <Link href="/admin/portal/dashboard" className="mcu-action mcu-action--primary mt-8">
            Open admin dashboard
          </Link>
        </div>
      </main>
    </AdminGuard>
  )
}
