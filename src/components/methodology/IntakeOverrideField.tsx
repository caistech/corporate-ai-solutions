'use client'

/**
 * Rule 16 reasoned-override field. Shown on a manual intake form when the board
 * is NOT triaged (the intake gate is blocked). The operator must type a written
 * reason to force one product through; the reason is logged on the new card.
 * Shared by AddChosenProduct + AddNewIdea so the override UX is defined once.
 *
 * The list of untriaged cards lives in the page-level banner (shown once); this
 * in-form box only states the count + takes the reason, so a blocked board
 * doesn't repeat the same chip list under every form.
 */
export function IntakeOverrideField({
  untriaged,
  value,
  onChange,
}: {
  untriaged: { product_slug: string; display_name: string | null }[]
  value: string
  onChange: (v: string) => void
}) {
  const n = untriaged.length
  return (
    <div className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3">
      <p className="text-sm font-semibold text-yellow-200">
        Intake blocked — {n} card{n === 1 ? '' : 's'} untriaged (Rule 16)
      </p>
      <p className="mt-1 text-sm text-yellow-100/80">
        Drain the backlog first (see the list above): push each into research, or record a terminal
        decision (kill / personal-interest / redesign). Or type a reason to force this one through —
        the override is logged on the card.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="Why admit this product before the backlog is drained? (logged)"
        className="mt-3 w-full rounded-lg border border-yellow-500/40 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-yellow-400"
      />
    </div>
  )
}
