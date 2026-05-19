// @explanatory-header-exempt — nested workflow page; entry-point header lives on the parent surface
import Link from 'next/link'
import { createClient } from '@/lib/pipeline/supabase-server'
import { ContactCard } from '@/components/pipeline/ContactCard'
import type { Contact } from '@/lib/pipeline/types'

export const dynamic = 'force-dynamic'

type SearchParams = {
  q?: string
  status?: string
  source?: string
  sort?: string
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createClient()

  let query = supabase.schema('pipeline').from('contacts').select('*')

  if (searchParams.q) {
    const q = searchParams.q.replace(/[%_]/g, (m) => '\\' + m)
    query = query.or(
      `name.ilike.%${q}%,company.ilike.%${q}%,notes.ilike.%${q}%,what_they_want.ilike.%${q}%,what_i_want.ilike.%${q}%`
    )
  }

  if (searchParams.status) {
    const statuses = searchParams.status.split(',').filter(Boolean)
    if (statuses.length > 0) query = query.in('status', statuses)
  }

  if (searchParams.source) {
    const sources = searchParams.source.split(',').filter(Boolean)
    if (sources.length > 0) query = query.in('source', sources)
  }

  const sort = searchParams.sort ?? 'next_action_due_asc'
  switch (sort) {
    case 'created_desc':
      query = query.order('created_at', { ascending: false })
      break
    case 'name_asc':
      query = query.order('name', { ascending: true })
      break
    case 'priority_asc':
      query = query.order('priority', { ascending: true })
      break
    case 'next_action_due_asc':
    default:
      query = query.order('next_action_due', { ascending: true, nullsFirst: false })
  }

  const { data: rows, error } = await query

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Failed to load contacts: {error.message}
      </div>
    )
  }

  const contacts = (rows ?? []) as Contact[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Contacts</h1>
        <Link
          href="/pipeline/contacts/new"
          className="min-h-[44px] inline-flex items-center bg-[#FF6B35] text-white font-semibold rounded px-4 py-2 hover:bg-[#e85a25]"
        >
          + New
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap items-center gap-3 bg-white rounded-lg border border-gray-200 p-4">
        <input
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder="Search name, company, notes…"
          className="flex-1 min-w-[200px] px-3 py-2 min-h-[44px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
        />
        <select
          name="sort"
          defaultValue={sort}
          className="px-3 py-2 min-h-[44px] border border-gray-300 rounded bg-white"
        >
          <option value="next_action_due_asc">Sort: due date</option>
          <option value="created_desc">Sort: newest</option>
          <option value="name_asc">Sort: name</option>
          <option value="priority_asc">Sort: priority</option>
        </select>
        <button
          type="submit"
          className="min-h-[44px] bg-[#1E5AA8] text-white px-4 py-2 rounded hover:bg-[#164a8b] font-medium"
        >
          Apply
        </button>
      </form>

      {contacts.length === 0 ? (
        <p className="text-[#5C6B7A]">No contacts match your filters.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <ContactCard key={c.id} contact={c} />
          ))}
        </div>
      )}

      <p className="text-xs text-[#5C6B7A] mt-6">{contacts.length} contacts</p>
    </div>
  )
}
