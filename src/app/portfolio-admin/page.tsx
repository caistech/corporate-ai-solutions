// /portfolio-admin — the Corporate AI Solutions / Global Buildtech Australia entity-level
// control plane. This sits above individual products (Kira, F2K-Checkpoint, etc.) — it is
// NOT another product's own admin, and it is not the /admin/pipeline validation cockpit
// (that still runs the pre-build idea-validation loop; this is post-build project registry
// and overview). Each project keeps its own portal and its own database — this page only
// holds portfolio-level facts about each project and a link down into it.
//
// Reads portfolio_manifest (the existing, thin cockpit-membership table — untouched, still
// consumed by portfolio-env-sync/the marketplace) merged with portfolio_projects (new,
// 20260921150000 — objectives/description/portal_url, soft-keyed by slug). A project can
// exist in either table without the other; the merge is by slug in this page, not a DB join,
// so neither table's existing consumers are coupled to this new one.

import { supabaseAdmin } from '@/lib/supabase';

export const metadata = { title: 'Portfolio Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

interface ManifestRow {
  slug: string;
  display_name: string | null;
  category: 'infrastructure' | 'own-tools' | 'product' | 'client-product' | null;
}

interface ProjectRow {
  slug: string;
  display_name: string;
  objectives: string | null;
  description: string | null;
  portal_url: string | null;
  origin: 'operator' | 'voice_interview';
}

interface MergedProject {
  slug: string;
  displayName: string;
  category: string | null;
  objectives: string | null;
  description: string | null;
  portalUrl: string | null;
}

async function loadProjects(): Promise<MergedProject[]> {
  const db = supabaseAdmin();

  const [{ data: manifest }, { data: projects }] = await Promise.all([
    db
      .from('portfolio_manifest')
      .select('slug, display_name, category')
      .returns<ManifestRow[]>(),
    db
      .from('portfolio_projects')
      .select('slug, display_name, objectives, description, portal_url, origin')
      .returns<ProjectRow[]>(),
  ]);

  const projectBySlug = new Map((projects ?? []).map((p) => [p.slug, p]));
  const manifestSlugs = new Set((manifest ?? []).map((m) => m.slug));

  const merged: MergedProject[] = (manifest ?? []).map((m) => {
    const project = projectBySlug.get(m.slug);
    return {
      slug: m.slug,
      displayName: project?.display_name || m.display_name || m.slug,
      category: m.category,
      objectives: project?.objectives ?? null,
      description: project?.description ?? null,
      portalUrl: project?.portal_url ?? null,
    };
  });

  // A project can be registered here (via the interview, once wired) without yet having a
  // portfolio_manifest row (Vercel/Supabase deployment refs) — don't hide it for that.
  for (const project of projects ?? []) {
    if (!manifestSlugs.has(project.slug)) {
      merged.push({
        slug: project.slug,
        displayName: project.display_name,
        category: null,
        objectives: project.objectives,
        description: project.description,
        portalUrl: project.portal_url,
      });
    }
  }

  return merged.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export default async function PortfolioAdminPage() {
  const projects = await loadProjects();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Portfolio Admin</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
            Every project Global Buildtech Australia runs — Kira, F2K-Checkpoint, and anything
            after them — with what each one is for and a link into its own portal. This page
            only holds portfolio-level facts; each project owns its own operational data,
            database, and admin surface below this.
          </p>
        </header>

        <div className="mb-6 flex flex-col gap-2 rounded-lg border border-gray-border bg-gray-dark/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-light/70">
            New projects register here first — a short voice interview captures what the
            project is and its objectives.
          </p>
          <button
            type="button"
            disabled
            title="Not wired yet — the voice-interview intake is the next piece to build."
            className="min-h-[44px] w-full shrink-0 rounded-lg border border-gray-700 bg-black/30 px-4 py-2 text-sm text-gray-500 sm:w-auto"
          >
            Add New Project (coming soon)
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.slug}
              className="flex flex-col rounded-2xl border border-gray-border bg-gray-dark/40 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold text-white">{project.displayName}</h2>
                {project.category && (
                  <span className="rounded-full border border-gray-700 px-2 py-0.5 text-xs uppercase tracking-wide text-gray-400">
                    {project.category}
                  </span>
                )}
              </div>

              {project.objectives && (
                <p className="mt-3 text-sm leading-relaxed text-gray-300">
                  {project.objectives}
                </p>
              )}

              {project.description && (
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {project.description}
                </p>
              )}

              {!project.objectives && !project.description && (
                <p className="mt-3 text-sm italic text-gray-600">
                  No portfolio-level record yet — registered in portfolio_manifest only.
                </p>
              )}

              {project.portalUrl ? (
                <a
                  href={project.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 self-start rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:border-accent"
                >
                  Manage {project.displayName} &rarr;
                </a>
              ) : (
                <p className="mt-4 text-xs text-gray-600">No portal URL on record.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
