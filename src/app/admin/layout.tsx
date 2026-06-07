import type { Metadata } from 'next'
import { AdminNav } from '@/components/admin/AdminNav'
import { AdminChromeClarifier } from '@/components/methodology/AdminChromeClarifier'

export const metadata: Metadata = {
  title: {
    default: 'Pipeline Admin',
    template: '%s · Pipeline Admin',
  },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white md:flex">
      <AdminNav />
      <main className="min-w-0 flex-1">{children}</main>
      {/* Chrome-level voice clarifier on every admin surface (§6); the card-detail page
          mounts its own card-aware clarifier and this one suppresses itself there. */}
      <AdminChromeClarifier />
    </div>
  )
}
