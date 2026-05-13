import Link from 'next/link'
import { createClient } from '@/lib/pipeline/supabase-server'
import { TodayList } from '@/components/pipeline/TodayList'
import { DORMANT_STATUSES } from '@/lib/pipeline/constants'
import type { Contact } from '@/lib/pipeline/types'

export const dynamic = 'force-dynamic'

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default async function TodayPage() {
  const supabase = createClient()
  const today = isoDate(new Date())
  const weekOut = new Date()
  weekOut.setDate(weekOut.getDate() + 7)
  const weekIso = isoDate(weekOut)

  const { data: rows, error } = await supabase
    .schema('pipeline')
    .from('contacts')
    .select('*')
    .not('status', 'in', `(${DORMANT_STATUSES.join(',')})`)
    .order('next_action_due', { ascending: true, nullsFirst: false })

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Failed to load contacts: {error.message}
      </div>
    )
  }

  const contacts = (rows ?? []) as Contact[]

  const overdue = contacts.filter(
    (c) =>
      c.next_action_due &&
      c.next_action_due < today &&
      ['open', 'active', 'waiting_on_me'].includes(c.status)
  )
  const todays = contacts.filter((c) => c.next_action_due === today)
  const thisWeek = contacts.filter(
    (c) => c.next_action_due && c.next_action_due > today && c.next_action_due <= weekIso
  )
  const awaitingThem = contacts.filter(
    (c) => c.status === 'waiting_on_them' && !c.next_action_due
  )
  const noNextAction = contacts.filter(
    (c) => !c.next_action_due && ['open', 'active'].includes(c.status)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">Today</h1>
          <p className="text-sm text-[#5C6B7A]">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link
          href="/pipeline/contacts/new"
          className="min-h-[44px] inline-flex items-center bg-[#FF6B35] text-white font-semibold rounded px-4 py-2 hover:bg-[#e85a25]"
        >
          + Add contact
        </Link>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-[#5C6B7A] mb-4">No active threads. The clock starts on the first capture.</p>
          <Link
            href="/pipeline/contacts/new"
            className="inline-flex items-center bg-[#FF6B35] text-white font-semibold rounded px-4 py-2"
          >
            Capture first contact
          </Link>
        </div>
      ) : (
        <TodayList
          sections={[
            { id: 'overdue', title: 'Overdue', tone: 'red', contacts: overdue },
            { id: 'today', title: 'Today', tone: 'orange', contacts: todays },
            { id: 'week', title: 'This week', tone: 'neutral', contacts: thisWeek },
            { id: 'awaiting', title: 'Awaiting them', tone: 'muted', contacts: awaitingThem, collapsedByDefault: true },
            { id: 'no-next', title: 'No next action set', tone: 'muted', contacts: noNextAction, collapsedByDefault: true },
          ]}
        />
      )}
    </div>
  )
}
