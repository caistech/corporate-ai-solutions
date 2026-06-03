# sync-coach-skill.ps1
# Vendors the onboarding coach SKILL from cais-shared-services into the cockpit so it
# is bundled into the Vercel build. Source of truth = cais-shared-services; this drops
# a copy at src/skills/onboarding-coach/SKILL.md.
#
# Usage:
#   .\scripts\sync-coach-skill.ps1                  # copy from local sibling repo (default)
#   .\scripts\sync-coach-skill.ps1 -FromGitHub      # fetch latest from GitHub raw
#
# Run from the cockpit repo root.

param(
  [switch]$FromGitHub,
  # Local path to the shared repo's skill (adjust if your checkout differs).
  [string]$SharedSkillPath = "..\cais-shared-services\product-factory\skills\onboarding-coach\SKILL.md",
  # GitHub raw URL (used with -FromGitHub).
  [string]$GitHubRawUrl = "https://raw.githubusercontent.com/caistech/cais-shared-services/main/product-factory/skills/onboarding-coach/SKILL.md"
)

$ErrorActionPreference = "Stop"
$dest = "src\skills\onboarding-coach\SKILL.md"
$destDir = Split-Path $dest -Parent

if (-not (Test-Path $destDir)) {
  New-Item -ItemType Directory -Force -Path $destDir | Out-Null
}

if ($FromGitHub) {
  Write-Host "Fetching coach SKILL from GitHub raw..." -ForegroundColor Cyan
  Invoke-WebRequest -Uri $GitHubRawUrl -OutFile $dest -UseBasicParsing
} else {
  if (-not (Test-Path $SharedSkillPath)) {
    Write-Error "Shared skill not found at $SharedSkillPath. Pass -SharedSkillPath or use -FromGitHub."
    exit 1
  }
  Write-Host "Copying coach SKILL from $SharedSkillPath..." -ForegroundColor Cyan
  Copy-Item -Path $SharedSkillPath -Destination $dest -Force
}

# Sanity: non-empty + contains the write-contract marker so we don't bundle a stub.
$content = Get-Content $dest -Raw
if ([string]::IsNullOrWhiteSpace($content) -or ($content -notmatch "WRITE CONTRACT")) {
  Write-Error "Synced SKILL.md looks wrong (empty or missing WRITE CONTRACT section)."
  exit 1
}

Write-Host "OK -> $dest ($($content.Length) chars)" -ForegroundColor Green
