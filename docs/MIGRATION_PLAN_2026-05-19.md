# Migration Plan — longtail-ai-studio

- **Repo:** `C:\Users\denni\PycharmProjects\Corporate-AI-Solutions`
- **Generated:** 2026-05-19T16:15:18.795Z
- **Compliance before plan:** 64% (7/11 rules)

## How to use this plan

1. Read each step below.
2. For PATCH steps, the migrator can apply them via `portfolio-migrator apply --plan <this-file>.json --yes`.
3. For NOTE steps, follow the embedded instructions by hand.
4. After applying, re-run `portfolio-migrator status` to verify compliance moved.
5. Commit + open a PR. The migrator never pushes — that's yours.

## Steps (7)

### 1. Update package.json — add @caistech/portfolio-gate ^0.2.0 (devDependencies) + add / upgrade @caistech/corporate-components to ^0.2.0 (dependencies)

- **Kind:** patch
- **Rule:** R13
- **Migration id:** `install-portfolio-gate`

Single package.json rewrite. add @caistech/portfolio-gate ^0.2.0 (devDependencies). add / upgrade @caistech/corporate-components to ^0.2.0 (dependencies).

Portfolio-gate (R13) brings the CI smoke tests, errorResponse helper, and static audits. Corporate-components (R1) ships <AuthForm/> in 0.2.0 — required for the R1 swap migration.

**Files written:**
- `package.json`

**Follow-up command:** `npm install`

### 2. Scaffold routes.config.json

- **Kind:** patch
- **Rule:** R13
- **Migration id:** `scaffold-routes-config`

Default top-level route list (homepage, /pricing, /about, /contact, /login, /signup, /forgot-password, /privacy, /terms, /api/health). Edit to match your product's actual routes before running the smoke test.

**Files written:**
- `routes.config.json` (only if missing)

### 3. Scaffold auth.config.json

- **Kind:** patch
- **Rule:** R1
- **Migration id:** `scaffold-auth-config`

Per-product auth path map used by portfolio-gate-smoke-auth. The four legs are wired against the conventional paths (/login, /signup, /forgot-password, /api/auth/*) — edit if your product diverges.

**Files written:**
- `auth.config.json` (only if missing)

### 4. Scaffold .github/workflows/gate.yml

- **Kind:** patch
- **Rule:** R13
- **Migration id:** `scaffold-gate-workflow`

GitHub Action template — runs typecheck + lint + build + route + auth smoke tests on PR + push to main. Requires GITHUB_PACKAGES_TOKEN secret and PORTFOLIO_GATE_PREVIEW_URL repo variable.

**Files written:**
- `.github/workflows/gate.yml` (only if missing)

### 5. Scrub vendor identity references

- **Kind:** note
- **Rule:** R11
- **Migration id:** `vendor-identity-scrub`

Replace literal references to operator handle / mobile / Calendly / email with process.env.NEXT_PUBLIC_VENDOR_* references. Marked NOTE because the exact substitution depends on the call site — string template vs JSX text vs prop value all need slightly different syntax. Review each before applying.

**Note body:**

32 occurrences of vendor identity strings were detected. Replace each with a process.env reference and add the placeholder to .env.example.

| File | Find | Replace with |
|---|---|---|
| `docs/dennis cmmahon future files/Dennis_McMahon_Resume.html` | `dennis@corporateaisolutions` | `${process.env.NEXT_PUBLIC_VENDOR_EMAIL ?? ''}` |
| `docs/dennis cmmahon future files/Dennis_McMahon_Resume.html` | `+61402612471` | `${process.env.NEXT_PUBLIC_VENDOR_PHONE ?? ''}` |
| `docs/dennis cmmahon future files/Dennis_McMahon_Resume.html` | `+61 402 612 471` | `${process.env.NEXT_PUBLIC_VENDOR_PHONE ?? ''}` |
| `docs/dennis cmmahon future files/Dennis_McMahon_Resume.md` | `dennis@corporateaisolutions` | `${process.env.NEXT_PUBLIC_VENDOR_EMAIL ?? ''}` |
| `docs/dennis cmmahon future files/Dennis_McMahon_Resume.md` | `+61 402 612 471` | `${process.env.NEXT_PUBLIC_VENDOR_PHONE ?? ''}` |
| `docs/dennis cmmahon future files/email_to_ethan.html` | `dennis@corporateaisolutions` | `${process.env.NEXT_PUBLIC_VENDOR_EMAIL ?? ''}` |
| `docs/pricing and partner rewrite/partner-rewrite-may-2026.md` | `mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_HANDLE ?? ''}` |
| `docs/pricing and partner rewrite/partner-rewrite-may-2026.md` | `calendly.com/mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_CALENDLY ?? ''}` |
| `docs/pricing and partner rewrite/pricing-rewrite-may-2026.md` | `mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_HANDLE ?? ''}` |
| `docs/pricing and partner rewrite/pricing-rewrite-may-2026.md` | `calendly.com/mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_CALENDLY ?? ''}` |
| `public/resume.html` | `dennis@corporateaisolutions` | `${process.env.NEXT_PUBLIC_VENDOR_EMAIL ?? ''}` |
| `public/resume.html` | `+61402612471` | `${process.env.NEXT_PUBLIC_VENDOR_PHONE ?? ''}` |
| `public/resume.html` | `+61 402 612 471` | `${process.env.NEXT_PUBLIC_VENDOR_PHONE ?? ''}` |
| `README.md` | `+61402612471` | `${process.env.NEXT_PUBLIC_VENDOR_PHONE ?? ''}` |
| `src/app/about/page.tsx` | `mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_HANDLE ?? ''}` |
| `src/app/about/page.tsx` | `calendly.com/mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_CALENDLY ?? ''}` |
| `src/app/deck/page.tsx` | `mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_HANDLE ?? ''}` |
| `src/app/deck/page.tsx` | `calendly.com/mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_CALENDLY ?? ''}` |
| `src/components/corporate/CorporateFooter.tsx` | `mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_HANDLE ?? ''}` |
| `src/components/corporate/CorporateFooter.tsx` | `calendly.com/mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_CALENDLY ?? ''}` |
| `src/components/corporate/CorporateFooter.tsx` | `+61402612471` | `${process.env.NEXT_PUBLIC_VENDOR_PHONE ?? ''}` |
| `src/components/corporate/CorporateFooter.tsx` | `dennis@corporateaisolutions` | `${process.env.NEXT_PUBLIC_VENDOR_EMAIL ?? ''}` |
| `src/components/KiraBranding.tsx` | `mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_HANDLE ?? ''}` |
| `src/components/KiraBranding.tsx` | `calendly.com/mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_CALENDLY ?? ''}` |
| `src/components/KiraBranding.tsx` | `dennis@corporateaisolutions` | `${process.env.NEXT_PUBLIC_VENDOR_EMAIL ?? ''}` |
| `src/lib/constants.ts` | `+61402612471` | `${process.env.NEXT_PUBLIC_VENDOR_PHONE ?? ''}` |
| `src/lib/constants.ts` | `+61 402 612 471` | `${process.env.NEXT_PUBLIC_VENDOR_PHONE ?? ''}` |
| `src/lib/constants.ts` | `mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_HANDLE ?? ''}` |
| `src/lib/constants.ts` | `calendly.com/mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_CALENDLY ?? ''}` |
| `src/lib/elevenlabs.ts` | `mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_HANDLE ?? ''}` |
| `src/lib/elevenlabs.ts` | `calendly.com/mcmdennis` | `${process.env.NEXT_PUBLIC_VENDOR_CALENDLY ?? ''}` |
| `src/lib/email.ts` | `dennis@corporateaisolutions` | `${process.env.NEXT_PUBLIC_VENDOR_EMAIL ?? ''}` |

These are NOT auto-applied because the exact substitution depends on the call site:
- Inside a string template: `\${process.env.NEXT_PUBLIC_VENDOR_EMAIL ?? ''}`
- Inside JSX text: `{process.env.NEXT_PUBLIC_VENDOR_EMAIL}`
- Inside a prop value: `vendorEmail={process.env.NEXT_PUBLIC_VENDOR_EMAIL}`

Apply by hand, verify with `npx portfolio-gate-audit-vendor-leak`, then commit.

### 6. Update .env.example — add NEXT_PUBLIC_VENDOR_* placeholders (R11) + RESEND_FROM_EMAIL (R6)

- **Kind:** patch
- **Rule:** R6
- **Migration id:** `add-resend-from-email-example`

Single .env.example rewrite. NEXT_PUBLIC_VENDOR_* placeholders (R11). RESEND_FROM_EMAIL (R6).

**Files written:**
- `.env.example`

### 7. Replace USING (true) RLS policies

- **Kind:** note
- **Rule:** R9
- **Migration id:** `rls-using-true-note`

Migrations contain USING (true) on data-bearing tables. NOTE-only — the replacement owner column depends on the table's tenancy model.

**Note body:**

One or more migrations contain `USING (true)` against a data-bearing
table — this violates Portfolio Standard R9.

`USING (true)` allows every authenticated row to read every other row's
data, which is a Privacy Act exposure on REGULATED and REVENUE tier
products. The naive-tester sweep on 2026-05-19 found this exact pattern
on Connexions, Universal Interviews, Platform-Trust, and Longtail-AIVS.

### How to fix

For each violation, write a new migration that:

1. `DROP POLICY IF EXISTS <name> ON <table>;`
2. `CREATE POLICY <name> ON <table> FOR <ops> TO <role>
   USING (auth.uid() = <owner_column>);`

The owner column varies per table — `owner_id`, `user_id`, `org_id`,
`tenant_id` are all common. The migrator cannot infer the correct column
safely, so this step is **note-only**.

### Verify

After applying, run:

```bash
npx portfolio-gate-audit-rls
```

It must report `PASS` before the deploy promotes.

### Locations

- `supabase/migrations/001_initial_schema.sql:189`
- `supabase/migrations/001_initial_schema.sql:196`
- `supabase/migrations/001_initial_schema.sql:203`
- `supabase/migrations/001_initial_schema.sql:210`
- `supabase/migrations/001_initial_schema.sql:217`
- `supabase/migrations/001_initial_schema.sql:224`
- `supabase/migrations/001_initial_schema.sql:231`
- `supabase/migrations/001_initial_schema.sql:238`
- `supabase/migrations/001_initial_schema.sql:242`
