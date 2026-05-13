import type { Metadata } from 'next'
import { PipelineNav } from '@/components/pipeline/PipelineNav'
import { createClient } from '@/lib/pipeline/supabase-server'

export const metadata: Metadata = {
  title: 'Pipeline Tracker',
  description: 'Private CRM for Dennis McMahon.',
  robots: { index: false, follow: false },
}

export default async function PipelineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1A2332]" style={{ fontFamily: '-apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
      {user && <PipelineNav />}
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
