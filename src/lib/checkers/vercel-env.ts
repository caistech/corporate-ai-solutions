// src/lib/checkers/vercel-env.ts
//
// #2 / check 40 — Vercel env hygiene, auto-verifiable (get_project does NOT expose
// the env list; this hits /v9/projects/{id}/env directly with the cockpit's token).
//
// Rule (per the readiness rubric): every SECRET env var must be
//   - type === "sensitive"  (stored unreadable; Vercel forbids sensitive in dev)
//   - targeted to production AND preview, never development
//
// Vercel env var types: plain | encrypted | sensitive | system  (legacy: secret).
// Exclusions (these are NOT secrets and must not be flagged):
//   - type "system"        — Vercel-managed (VERCEL_URL, etc.)
//   - keys "NEXT_PUBLIC_*"  — deliberately public/client-exposed, correctly plain
// Tune SECRET_EXCLUDE_PREFIXES if other public prefixes exist (e.g. "PUBLIC_").

type VercelEnvType = "plain" | "encrypted" | "sensitive" | "system" | "secret";

interface VercelEnvVar {
  key: string;
  type: VercelEnvType;
  target?: string[]; // e.g. ["production","preview"]
}

interface VercelEnvListResponse {
  envs: VercelEnvVar[];
}

export interface Code40Offender {
  key: string;
  reason: string;
}

export interface Code40Result {
  status: "pass" | "fail";
  offenders: Code40Offender[];
  checked: number; // secrets actually evaluated (after exclusions)
}

const SECRET_EXCLUDE_PREFIXES = ["NEXT_PUBLIC_"];

function isPublicByConvention(key: string): boolean {
  return SECRET_EXCLUDE_PREFIXES.some((p) => key.startsWith(p));
}

export async function checkVercelEnvCode40(opts: {
  projectId: string;
  token: string;
  teamId?: string;
  fetchImpl?: typeof fetch;
}): Promise<Code40Result> {
  const doFetch = opts.fetchImpl ?? fetch;
  const url = new URL(`https://api.vercel.com/v9/projects/${opts.projectId}/env`);
  if (opts.teamId) url.searchParams.set("teamId", opts.teamId);

  const res = await doFetch(url.toString(), {
    headers: { Authorization: `Bearer ${opts.token}` },
  });

  if (!res.ok) {
    // Fail closed — can't verify means not earned.
    return {
      status: "fail",
      offenders: [{ key: "*", reason: `Vercel API ${res.status} ${res.statusText}` }],
      checked: 0,
    };
  }

  const body = (await res.json()) as VercelEnvListResponse;
  const offenders: Code40Offender[] = [];
  let checked = 0;

  for (const v of body.envs ?? []) {
    if (v.type === "system") continue;        // Vercel-managed, not a secret
    if (isPublicByConvention(v.key)) continue; // intentionally public
    checked++;

    if (v.type !== "sensitive") {
      offenders.push({ key: v.key, reason: `type "${v.type}", expected "sensitive"` });
    }

    const targets = new Set(v.target ?? []);
    if (targets.has("development")) {
      offenders.push({ key: v.key, reason: "targets Development" });
    }
    if (!targets.has("production") || !targets.has("preview")) {
      offenders.push({
        key: v.key,
          reason: `target [${Array.from(targets).join(", ") || "none"}], expected production+preview`,

      });
    }
  }

  return {
    status: offenders.length === 0 ? "pass" : "fail",
    offenders,
    checked,
  };
}
