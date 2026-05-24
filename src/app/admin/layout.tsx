import type { Metadata } from 'next'
import { AdminNav } from '@/components/admin/AdminNav'

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
    </div>
  )
}
