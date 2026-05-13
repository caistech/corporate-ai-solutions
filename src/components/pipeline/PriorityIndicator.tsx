const STYLES: Record<number, { cls: string; label: string }> = {
  1: { cls: 'bg-[#FF6B35]', label: 'High' },
  2: { cls: 'bg-[#1E5AA8]', label: 'Mid' },
  3: { cls: 'bg-gray-300', label: 'Low' },
}

export function PriorityIndicator({ priority }: { priority: number }) {
  const { cls, label } = STYLES[priority] ?? STYLES[2]
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#5C6B7A]">
      <span className={`inline-block w-2 h-2 rounded-full ${cls}`} aria-hidden />
      {label}
    </span>
  )
}
