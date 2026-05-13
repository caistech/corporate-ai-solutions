import { STATUS_LABELS } from '@/lib/pipeline/constants'

const STYLES: Record<string, string> = {
  open: 'bg-gray-200 text-gray-700',
  active: 'bg-[#1E5AA8] text-white',
  waiting_on_them: 'bg-[#F7B500] text-[#1A2332]',
  waiting_on_me: 'bg-[#FF6B35] text-white',
  paused: 'bg-gray-100 text-gray-500',
  won: 'bg-[#0B7A5C] text-white',
  lost: 'bg-gray-300 text-gray-600',
  archived: 'bg-gray-100 text-gray-400',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = STYLES[status] ?? 'bg-gray-100 text-gray-600'
  const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold tracking-wide uppercase ${cls}`}
    >
      {label}
    </span>
  )
}
