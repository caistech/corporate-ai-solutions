// @explanatory-header-exempt — nested workflow page; entry-point header lives on the parent surface
'use client'

import Link from 'next/link'
import { ContactForm } from '@/components/pipeline/ContactForm'
import { createContact } from '@/lib/pipeline/actions/contacts'

export default function NewContactPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/pipeline/today" className="text-sm text-[#1E5AA8] hover:underline">
          ← Today
        </Link>
        <h1 className="text-2xl font-bold text-[#0B1F3A] mt-2">New contact</h1>
        <p className="text-sm text-[#5C6B7A]">Capture in under 30 seconds. Everything else can wait.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <ContactForm
          mode="new"
          onSubmit={createContact}
          redirectPath={(id) => `/pipeline/contacts/${id}`}
        />
      </div>
    </div>
  )
}
