# Singify — Build Override (read AFTER the package, BEFORE NEXT_STEPS)

**Added:** 2026-05-24, after the strategic session that locked the product-development
pipeline, the four monetisation lanes, the lane-1 release pattern, the build-first
principle, and the portfolio consolidation map.

**Why this exists:** the handoff package (`00`–`06`) is excellent as the *platform spec
and engineering bible* — keep all of it. But it was written just before the sequencing
and architecture decisions below were locked, so it is **out of date by one session in
two specific ways**: its build *order* and its *stack framing*. This doc overrides those
two things. Everything else in the package stands.

Cross-reference (operator memory, authoritative): `project-product-development-pipeline`,
`project-lane1-product-release-pattern`, `project-monetisation-lanes`,
`project-assessment-progression-engine`, `project-portfolio-consolidation-map`, `project-singify`.

---

## 1. ONE architecture — Next.js / Vercel / Supabase + one isolated Python audio service

The package's frontend (Gradio), backend (FastAPI-as-the-whole-backend), and hosting
(Render / HF Spaces) read like a different stack. They are not the architecture — they
were prototype conveniences. **Do not fork the architecture.** Five of eight layers
already match the portfolio standard; the three that don't all collapse to one root
cause: the audio DSP/ML (`psola`, `demucs`, `librosa`, `ffmpeg`, `WhisperX`, `torch`) is
irreducibly Python and cannot run on Vercel serverless (demucs is 5–8 min on CPU; the
torch/ffmpeg binary stack doesn't fit serverless).

**The rule:**

- **Build the standard Next.js / Vercel / Supabase product** for everything: UI,
  multi-tenancy, auth, RLS, distributor dashboard, white-label, storage, billing,
  and the voice coach via **`@caistech/elevenlabs-convai`** (the proven voice substrate —
  not a bespoke or LingoPure-forked coach).
- **Isolate the irreducible Python as ONE stateless audio microservice.** It takes a
  file + params, runs pitch-correct → polish → separate → mix → master → mux + the
  baseline analysis, returns the output. The Next.js app uploads to Supabase Storage,
  calls the service over HTTP, stores the result. Same pattern any app uses to offload
  heavy compute serverless can't do.

| Runs on the STANDARD stack (Next.js / Vercel / Supabase) | Runs in the ONE Python service |
|---|---|
| All UI + the lane-1 multi-tenant shell | pitch correction (psola) |
| Auth, RLS, distributor → end-user tenancy | polish chain (pedalboard) |
| Distributor dashboard, white-label, branding | vocal separation (demucs) |
| Supabase Storage + signed URLs | loudness master + ffmpeg mux |
| Stripe billing | yt-dlp backing download |
| Voice coach (`@caistech/elevenlabs-convai`) | WhisperX lyric alignment |
| LRCLIB + YouTube Data API calls | the vocal-baseline DSP analysis |

**Drop from the package:** Gradio, FastAPI-as-the-whole-backend. **Keep:** all the audio
patterns inside that one service (`sys.executable`, -14 LUFS, `+faststart`, vocal-only
correction, YouTube URL sanitisation — see `02_VALIDATION_LOG.md` §12).

**The only new infra in the portfolio's world:** a Python host for the audio worker —
Render / Railway / Fly / **Modal** (Modal is purpose-built: serverless Python ML, scales
to zero, per-second billing). One new thing, unavoidable for any audio-ML product.

**It's shared, not Singify-specific.** That audio worker IS the Engine-1 voice substrate.
Every voice/coaching vertical (LingoPure, the lingo family, Speakify, …) calls the same
service. Build it once for Singify; it pays off across the whole cluster. The vocal
baseline specifically is the **assessment/progression engine** primitive — build
`voice_profile` *for extraction to `@caistech`*, not Singify-locked (offshore-modular and
others need the same rubric → baseline → score → progression shape with no voice).

---

## 2. Build-to-validate sequencing — overrides NEXT_STEPS Phases 3–4

`04_NEXT_STEPS.md` prescribes: strategic review → multi-tenancy → auth → full platform
(~32h) → *then* validate. That inverts the locked sequencing and is the
expensive-Tier-1-before-validation trap. The package's own validation log says the core
experience isn't yet proven delightful ("doesn't sound much different"; polish subtle).
Do not build auth/multi-tenancy/billing on top of an unvalidated core.

**Correct order:**

1. **Thin dogfood slice (Gate A).** Single-tenant, founder-only. The core
   record → improve → coach experience on the **standard Next.js stack + the one Python
   audio service**. Port `pipeline.py` into the audio service; add the vocal baseline;
   one-click improve; coach feedback referencing baseline. No auth, no multi-tenancy, no
   billing yet. Vercel-default URL, no custom domain.
2. **That URL becomes Singify's cockpit `mvp_url`.** Add a `singify` card in the pipeline
   cockpit (`/admin/methodology`), set `mvp_url` + flip Gate 1.
3. **Validate (Gate B/C).** Kick off dual-stream research from the cockpit — singing
   teachers (distributor stream) + students (end-user stream), MVP link embedded. Real
   demand signal decides go/no-go.
4. **Only on a validated GO:** build the Tier-1 multi-tenant platform (auth, tenancy,
   white-label, billing, dashboards) per the package + the lane-1 release pattern, and
   buy the real domain (domain acquisition is Gate-2-gated).

The package's Phases 3–4 are correct *content* for step 4; they are just sequenced too
early. Multi-tenancy is "core from day 1" **of the platform build (step 4)** — not of the
thin validation slice.

---

## 3. The strategic review (package deliverable #1) is already done

`03_STRATEGIC_REVIEW_DIRECTIVE.md` demands a 2–4 page strategic review as the first
deliverable. This session produced it: the four monetisation lanes (Singify = first
lane-1 paid-distributor-SaaS product), the lane-1 engine/vertical release pattern, the
consolidation map (LingoPure + the lingo family + RaiseReady + Connexions as Engine-1
verticals of the same voice/coaching engine), and the assessment-engine extraction. Point
the build at the operator memories listed at the top rather than re-running the review.

Open questions the package flagged for the founder (brand architecture, voice-coach in
v0.1, beta distributor, geo, privacy) remain the founder's calls — do not decide
unilaterally.

---

## 4. What stays from the package, unchanged

- `01_PRD.md` — the platform spec. Authoritative for the eventual Tier-1 build.
- `02_VALIDATION_LOG.md` — the dogfood gold (headphone requirement, aggressive presets,
  baseline insight, the dead-fairseq lesson, the engineering inheritances). Honour all of it.
- The v0.1 product insights (`00` §7): headphone detect/nudge, aggressive default presets,
  baseline as the killer feature, -14 LUFS always on, auto-transpose to comfortable key,
  coach references baseline, backing stays clean, universal-compatible output.

**Net:** keep the package; build on the standard Next.js/Vercel/Supabase stack with one
isolated (shared) Python audio service; build the thin validation slice before the
platform.
