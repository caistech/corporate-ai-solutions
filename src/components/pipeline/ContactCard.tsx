import Link from 'next/link'
import { StatusBadge } from './StatusBadge'
import { PriorityIndicator } from './PriorityIndicator'
import type { Contact } from '@/lib/pipeline/types'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

export function ContactCard({ contact }: { contact: Contact }) {
  return (
    <Link
      href={`/pipeline/contacts/${contact.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-[#1E5AA8] transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-[#0B1F3A] truncate">{contact.name}</h3>
          {contact.company && (
            <p className="text-sm text-[#5C6B7A] truncate">{contact.company}</p>
          )}
        </div>
        <StatusBadge status={contact.status} />
      </div>

      {contact.what_i_want && (
        <p className="text-sm text-[#1A2332] mb-1 line-clamp-1">
          <span className="text-[#5C6B7A]">Want: </span>{contact.what_i_want}
        </p>
      )}

      {contact.next_action && (
        <p className="text-sm text-[#1A2332] mb-2 line-clamp-1">
          <span className="text-[#5C6B7A]">Next: </span>{contact.next_action}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs">
        {contact.next_action_due && (
          <span className="text-[#5C6B7A]">Due {formatDate(contact.next_action_due)}</span>
        )}
        <PriorityIndicator priority={contact.priority} />
      </div>
    </Link>
  )
}
