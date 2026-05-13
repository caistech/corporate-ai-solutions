import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/pipeline/supabase-server'
import { EditContactForm } from './EditContactForm'
import type { Contact } from '@/lib/pipeline/types'

export const dynamic = 'force-dynamic'

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .schema('pipeline')
    .from('contacts')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !data) notFound()
  const contact = data as Contact

  return (
    <div>
      <div className="mb-6">
        <Link href={`/pipeline/contacts/${contact.id}`} className="text-sm text-[#1E5AA8] hover:underline">
          ← {contact.name}
        </Link>
        <h1 className="text-2xl font-bold text-[#0B1F3A] mt-2">Edit contact</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <EditContactForm contact={contact} />
      </div>
    </div>
  )
}
