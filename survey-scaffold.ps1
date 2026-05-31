<#
.SYNOPSIS
  Survey Gate — SAFE scaffolding + cleanup only.

  Creates the new survey files (as clearly-marked stubs) at their correct paths and
  removes the confirmed-redundant Stage-6 leftovers. Does NOT touch any live scorer
  (score.ts, recalculate-score, loadCardScore) — that rewiring is hand-edits, by design.

.DESCRIPTION
  Run with -WhatIf FIRST to see every action without changing anything:
      .\survey-scaffold.ps1 -WhatIf
  Then run for real:
      .\survey-scaffold.ps1

  Idempotent: re-running skips files that already exist and deletes already-gone safely.
  Reversible: every deletion is a `git rm` (recoverable from history); every new file is
  an empty stub you fill in by hand.

.PARAMETER SharedRoot
  Path to the cais-shared-services repo root.

.PARAMETER CockpitRoot
  Path to the Corporate-AI-Solutions repo root.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$SharedRoot  = "C:\Users\denni\PycharmProjects\cais-shared-services",
  [string]$CockpitRoot = "C:\Users\denni\PycharmProjects\Corporate-AI-Solutions"
)

$ErrorActionPreference = "Stop"

function Section($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }

# --- guard: repos exist ------------------------------------------------------
foreach ($p in @($SharedRoot, $CockpitRoot)) {
  if (-not (Test-Path $p)) { throw "Repo root not found: $p" }
}

# A stub creator: makes parent dirs, writes a clearly-marked TODO stub, never overwrites.
function New-Stub {
  param([string]$Path, [string]$Marker)
  # -LiteralPath everywhere: paths contain [productId] and PS treats [ ] as wildcards.
  if (Test-Path -LiteralPath $Path) {
    Write-Host "  exists, skip : $Path" -ForegroundColor DarkGray
    return
  }
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path -LiteralPath $dir)) {
    if ($PSCmdlet.ShouldProcess($dir, "mkdir")) {
      New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
  }
  if ($PSCmdlet.ShouldProcess($Path, "create stub")) {
    Set-Content -LiteralPath $Path -Value $Marker -NoNewline
    Write-Host "  created      : $Path" -ForegroundColor Green
  }
}

# A safe git-rm: only acts if the file is tracked; otherwise plain delete; otherwise skip.
function Remove-Tracked {
  param([string]$RepoRoot, [string]$RelPath)
  $full = Join-Path $RepoRoot $RelPath
  if (-not (Test-Path -LiteralPath $full)) {
    Write-Host "  gone, skip   : $RelPath" -ForegroundColor DarkGray
    return
  }
  Push-Location $RepoRoot
  try {
    $tracked = (& git ls-files --error-unmatch -- $RelPath) 2>$null
    if ($LASTEXITCODE -eq 0 -and $tracked) {
      if ($PSCmdlet.ShouldProcess($RelPath, "git rm")) {
        & git rm -- $RelPath | Out-Null
        Write-Host "  git rm       : $RelPath" -ForegroundColor Yellow
      }
    } else {
      if ($PSCmdlet.ShouldProcess($full, "delete untracked")) {
        Remove-Item -LiteralPath $full -Force
        Write-Host "  deleted      : $RelPath (untracked)" -ForegroundColor Yellow
      }
    }
  } finally { Pop-Location }
}

# =============================================================================
# 1. NEW survey files — empty, clearly-marked stubs at the correct paths
# =============================================================================
Section "NEW survey stubs — Corporate-AI-Solutions (cockpit)"

New-Stub -Path (Join-Path $CockpitRoot "src\lib\methodology\survey.ts") -Marker @'
// survey.ts — STUB. Pure renovate/teardown scorer, the score.ts twin.
// Build per SCORER_RECONCILIATION_AND_SURVEY_PLAN.md §Survey:
//   - input: the 14 synched validation field VALUES + per-field artifact-evidence map
//   - presence rule: a field counts only if column non-null/non-empty (NOT has_* flags)
//   - verdict: INCOMPLETE-SPEC (<14 present) | TEARDOWN (<80% evidenced or P1/P2/P3 fail
//     or no website) | RENOVATION (>=80% evidenced AND P1,P2,P3 pass)
//   - pure function, no I/O — mirror scoreCard() in ./score.ts
// TODO: implement.
'@

New-Stub -Path (Join-Path $CockpitRoot "src\lib\methodology\load-card-survey.ts") -Marker @'
// load-card-survey.ts — STUB. Server-side loader, the loadCardScore() twin.
// Fetches the 14 validation fields from product_validation_status + the survey
// evidence map, then runs the pure scorer in ./survey.ts. Mirror loadCardScore().
// TODO: implement.
'@

New-Stub -Path (Join-Path $CockpitRoot "src\app\api\admin\pipeline\[productId]\survey\route.ts") -Marker @'
// survey/route.ts — STUB. POST endpoint to run + record a survey.
// Pattern: copy recalculate-score/route.ts's shape, but call load-card-survey + the
// pure survey scorer, then record via pipeline-gates recordGate({gate:'survey'}).
// TODO: implement.
'@

New-Stub -Path (Join-Path $CockpitRoot "src\components\admin\SurveyPanel.tsx") -Marker @'
// SurveyPanel.tsx — STUB. Verdict + per-field evidence display.
// Model on ReadinessPanel.tsx / ValidationTestResults.tsx. Shows renovation/teardown/
// incomplete-spec, the per-field evidenced/not map, and the toReach list.
// TODO: implement.
'@

Section "NEW survey skill stub — cais-shared-services (shared)"

New-Stub -Path (Join-Path $SharedRoot "pipeline-cockpit\skills\naive-tester\SURVEY_MODE.md") -Marker @'
# Survey Mode — STUB (the hard prompt work)

The evidence-not-inference reader. For each of the 14 synched validation fields, browse the
live site AND read the repo, and return either {evidenced:true, evidence:"<exact DOM text or
repo path:line>"} or {evidenced:false, evidence:null}. NO citation => false. "I could infer
this from world knowledge" => false. Emit survey.json: {fields:[...], pre_hard:{P1,P2,P3,P4}}.
See SCORER_RECONCILIATION_AND_SURVEY_PLAN.md §"the hard part". Iterate vs DealFindrs (teardown/
incomplete-spec) + a known-good product (renovation).
TODO: write the prompt; then fold into naive-tester/SKILL.md as a mode.
'@

# =============================================================================
# 2. CLEANUP — confirmed-redundant Stage-6 leftovers (reversible git rm)
# =============================================================================
Section "CLEANUP — cais-shared-services"

# (a) the misplaced/stale cockpit helper — redundant with the live cockpit's
#     src/lib/methodology/readiness.ts (Corporate-AI-Solutions). See plan §Repo placement.
Remove-Tracked -RepoRoot $SharedRoot -RelPath "product-factory/pipeline-cockpit/src/lib/readiness.ts"

# (b) the stray zip that rode along in an earlier commit (clutter, not code).
Remove-Tracked -RepoRoot $SharedRoot -RelPath "product-factory.zip"

# NOTE: the SQL scorer (supabase/migrations/20260531_readiness_scoring.sql) is NOT deleted
# here. It is superseded by score.ts but it is ALREADY APPLIED to the live DB, so removing
# the migration file would desync migration history from the DB. Decision on whether to keep
# it as a record or formally retire it is a HAND step in the plan, not safe to script.

Section "DONE"
Write-Host "Scaffolding + cleanup complete. Next steps are HAND-EDITS — see" -ForegroundColor Cyan
Write-Host "SCORER_RECONCILIATION_AND_SURVEY_PLAN.md (the scorer rewiring is NOT scripted)." -ForegroundColor Cyan
Write-Host "Run a build/typecheck in each repo before committing." -ForegroundColor Cyan
