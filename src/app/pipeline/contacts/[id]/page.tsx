import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/pipeline/supabase-server'
import { StatusBadge } from '@/components/pipeline/StatusBadge'
import { PriorityIndicator } from '@/components/pipeline/PriorityIndicator'
import { EventList } from '@/components/pipeline/EventList'
import { EventForm } from '@/components/pipeline/EventForm'
import { ContactActions } from './ContactActions'
import { SOURCE_LABELS } from '@/lib/pipeline/constants'
import type { Contact, Event } from '@/lib/pipeline/types'

export const dynamic = 'force-dynamic'

export default async function ContactDetail({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: contactRow, error: contactError } = await supabase
    .schema('pipeline')
    .from('contacts')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (contactError || !contactRow) {
    notFound()
  }
  const contact = contactRow as Contact

  const { data: eventRows } = await supabase
    .schema('pipeline')
    .from('events')
    .select('*')
    .eq('contact_id', params.id)
    .order('occurred_at', { ascending: false })

  const events = (eventRows ?? []) as Event[]

  return (
    <div>
      <Link href="/pipeline/contacts" className="text-sm text-[#1E5AA8] hover:underline">
        ← Contacts
      </Link>

      <div className="mt-3 bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#0B1F3A]">{contact.name}</h1>
            {contact.company && <p className="text-[#5C6B7A]">{contact.company}{contact.role ? ` · ${contact.role}` : ''}</p>}
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={contact.status} />
            <PriorityIndicator priority={contact.priority} />
            <Link
              href={`/pipeline/contacts/${contact.id}/edit`}
              className="text-sm text-[#1E5AA8] hover:underline"
            >
              Edit
            </Link>
          </div>
        </div>

        <dl className="grid sm:grid-cols-2 gap-4 text-sm mt-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#5C6B7A] mb-1">Source</dt>
            <dd>{SOURCE_LABELS[contact.source as keyof typeof SOURCE_LABELS] ?? contact.source}</dd>
          </div>
          {contact.email && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#5C6B7A] mb-1">Email</dt>
              <dd><a className="text-[#1E5AA8] hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a></dd>
            </div>
          )}
          {contact.linkedin_url && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#5C6B7A] mb-1">LinkedIn</dt>
              <dd><a className="text-[#1E5AA8] hover:underline" href={contact.linkedin_url} target="_blank" rel="noopener noreferrer">View profile</a></dd>
            </div>
          )}
          {contact.what_they_want && (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-[#5C6B7A] mb-1">What they want</dt>
              <dd>{contact.what_they_want}</dd>
            </div>
          )}
          {contact.what_i_want && (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-[#5C6B7A] mb-1">What I want</dt>
              <dd>{contact.what_i_want}</dd>
            </div>
          )}
          {contact.next_action && (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-[#5C6B7A] mb-1">Next action</dt>
              <dd>
                {contact.next_action}
                {contact.next_action_due && (
                  <span className="text-[#5C6B7A]"> · due {new Date(contact.next_action_due).toLocaleDateString()}</span>
                )}
              </dd>
            </div>
          )}
          {contact.notes && (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-[#5C6B7A] mb-1">Notes</dt>
              <dd className="whitespace-pre-wrap">{contact.notes}</dd>
            </div>
          )}
          {contact.tags.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-[#5C6B7A] mb-1">Tags</dt>
              <dd className="flex flex-wrap gap-2">
                {contact.tags.map((t) => (
                  <span key={t} className="bg-gray-100 text-[#1A2332] text-xs rounded px-2 py-0.5">{t}</span>
                ))}
              </dd>
            </div>
          )}
        </dl>

        <ContactActions contact={contact} />
      </div>

      <div className="mb-4">
        <EventForm contactId={contact.id} />
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C6B7A] mb-3">History</h2>
        <EventList events={events} />
      </div>
    </div>
  )
}
