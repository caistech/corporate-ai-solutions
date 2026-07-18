/**
 * /admin/reverse-scout/[assetId] — one asset through Stages 1–2.
 *
 * Shows the asset material, the Stage 1 Capability Card, and the Stage 2 Pattern + sector map.
 * The model's reasoning is surfaced everywhere — the operator is buying the *why* (BUILD_SPEC §4).
 */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAssetDetail } from '@/lib/reverse-scout/store'
import { StageRunner } from '@/components/admin/reverse-scout/StageRunner'
import type { Adjacency, SectorMap } from '@/lib/reverse-scout/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Asset · Reverse Scout' }

const ADJACENCY_STYLE: Record<Adjacency, string> = {
  core: 'border-gray-border bg-gray-mid text-gray-light',
  adjacent: 'border-accent/40 bg-accent/10 text-accent',
  lateral: 'border-purple-400/40 bg-purple-400/10 text-purple-300',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-xl border border-gray-border bg-gray-dark p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-light">{label}</dt>
      <dd className="mt-1 text-sm text-white">{value}</dd>
    </div>
  )
}

function chips(items: string[]) {
  if (items.length === 0) return <span className="text-gray-light">—</span>
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="rounded-md border border-gray-border bg-black px-2 py-0.5 text-xs text-gray-light">
          {item}
        </span>
      ))}
    </span>
  )
}

function SectorCard({ sector }: { sector: SectorMap }) {
  return (
    <li className="rounded-lg border border-gray-border bg-black p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white">{sector.sector}</span>
        <span className="flex items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-xs ${ADJACENCY_STYLE[sector.adjacency]}`}>
            {sector.adjacency}
          </span>
          <span className="text-xs text-gray-light">{Math.round(sector.confidence * 100)}% fit</span>
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-light">{sector.rationale}</p>
    </li>
  )
}

export default async function AssetDetailPage({ params }: { params: { assetId: string } }) {
  const detail = await getAssetDetail(params.assetId)
  if (!detail) notFound()

  const { asset, card, pattern } = detail

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link
        href="/admin/reverse-scout"
        className="inline-flex min-h-[44px] items-center gap-2 text-sm text-gray-light hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All assets
      </Link>

      <div className="mt-2">
        <h1 className="text-2xl font-bold text-white">{asset.name}</h1>
        <p className="mt-1 text-xs text-gray-light">
          {asset.source_type}
          {asset.raw_ref ? ` · ${asset.raw_ref}` : ''} · added {new Date(asset.created_at).toLocaleString()}
        </p>
      </div>

      <Section title="Asset material">
        <p className="whitespace-pre-wrap text-sm text-gray-light">{asset.source_text}</p>
      </Section>

      {/* Stage 1 */}
      <Section title="Stage 1 · Capability Card">
        {card ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Does what" value={card.does_what} />
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Reusable primitive"
                value={<span className="font-medium text-accent">{card.primitive}</span>}
              />
            </div>
            <Field label="Inputs" value={chips(card.inputs)} />
            <Field label="Outputs" value={chips(card.outputs)} />
            <Field label="Integration surface" value={card.integration_surface || '—'} />
            <Field label="Maturity" value={card.maturity_level || '—'} />
            <div className="sm:col-span-2">
              <Field label="Dependencies" value={chips(card.dependencies)} />
            </div>
            {card.reasoning && (
              <div className="sm:col-span-2">
                <Field label="Reasoning" value={<span className="text-gray-light">{card.reasoning}</span>} />
              </div>
            )}
          </dl>
        ) : (
          <p className="mb-4 text-sm text-gray-light">
            No Capability Card yet. Stage 1 abstracts the asset material into a factual card and names the reusable
            primitive underneath.
          </p>
        )}
        <div className="mt-4">
          <StageRunner assetId={asset.id} stage="card" hasResult={!!card} />
        </div>
      </Section>

      {/* Stage 2 */}
      <Section title="Stage 2 · Pattern map (the moat)">
        {pattern ? (
          <div className="flex flex-col gap-4">
            <Field
              label="Abstract problem shape"
              value={<span className="font-medium text-white">{pattern.abstract_problem_shape}</span>}
            />
            <Field label="Domain-stripped description" value={<span className="text-gray-light">{pattern.domain_stripped_desc}</span>} />
            <div>
              <dt className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-light">
                Sectors ({pattern.sectors.length})
              </dt>
              <ul className="flex flex-col gap-2">
                {pattern.sectors.map((s) => (
                  <SectorCard key={s.id} sector={s} />
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="mb-4 text-sm text-gray-light">
            No Pattern map yet. Stage 2 strips the domain from the primitive and re-projects it into sectors —
            including non-obvious ones — where the same problem-shape recurs.
          </p>
        )}
        <div className="mt-4">
          <StageRunner
            assetId={asset.id}
            stage="pattern"
            hasResult={!!pattern}
            disabled={!card}
            disabledHint="Generate the Capability Card (Stage 1) first."
          />
        </div>
      </Section>
    </div>
  )
}
