/**
 * /admin/reverse-scout — Reverse Scout (Stages 1–2).
 *
 * Internal operator tool: feed in a portfolio asset, get a factual Capability Card (Stage 1) and a
 * domain-stripped cross-sector Pattern map (Stage 2, the moat). Stages 3–4 (candidate discovery,
 * disclosure-safe outreach) are not built yet — dogfood the abstraction first.
 *
 * Auth: /admin/* is operator-gated by middleware (ADMIN_EMAILS). Reads use the service-role client
 * via the store (reverse_scout_* tables are RLS-on with no policies).
 */
import Link from 'next/link'
import { Radar } from 'lucide-react'
import { ExplanatoryHeader } from '@caistech/corporate-components'
import { listAssets } from '@/lib/reverse-scout/store'
import { PLATFORMS } from '@/lib/constants'
import { NewAssetForm } from '@/components/admin/reverse-scout/NewAssetForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reverse Scout' }

// Prefill options for dogfooding on the founder's own portfolio (BUILD_SPEC §0 "First user").
function portfolioOptions() {
  return PLATFORMS.filter((p) => p.type === 'parent').map((p) => ({
    name: p.name,
    text: [p.tagline, p.problem, p.description].filter(Boolean).join('\n\n'),
  }))
}

export default async function ReverseScoutPage() {
  const assets = await listAssets()

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <ExplanatoryHeader
        what="Reverse Scout"
        whatLong="An asset-first, push-based licensing-match engine. Feed it a capability; it abstracts the underlying primitive and maps it to sectors — including non-obvious ones — where the same problem-shape recurs."
        todo="Add an asset (paste a description, or prefill from a portfolio product), then generate its Capability Card and Pattern map."
        matters="It surfaces who could license a capability you already built. The cross-sector reframing is the defensible core — outreach comes in a later stage."
      />

      <div className="mt-6 rounded-xl border border-gray-border bg-gray-dark p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Add an asset</h2>
        <NewAssetForm portfolioOptions={portfolioOptions()} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Assets</h2>
        {assets.length === 0 ? (
          <p className="rounded-lg border border-gray-border bg-gray-dark p-6 text-sm text-gray-light">
            No assets yet. Add one above to run it through Stages 1–2.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {assets.map((asset) => (
              <li key={asset.id}>
                <Link
                  href={`/admin/reverse-scout/${asset.id}`}
                  className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg border border-gray-border bg-gray-dark px-4 py-3 transition-colors hover:border-accent"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Radar className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">{asset.name}</span>
                      <span className="block truncate text-xs text-gray-light">
                        {asset.source_type} · {new Date(asset.created_at).toLocaleDateString()}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-light">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
