# Singify Platform — Claude Code Handoff Package

**Project:** Singify (and its underlying multi-tenant voice-AI platform)
**Founder:** Dennis
**Handoff date:** May 24, 2026
**Status:** Working v3 prototype validated. Ready for Claude Code to scaffold the platform proper.

---

## 0. How to read this document

This package is the complete state of the Singify project at handoff. Read all sections before writing code.

**The package consists of:**

| File | Purpose |
|---|---|
| `README_HANDOFF.md` (this file) | Master document. Read first. |
| `SINGIFY_PLATFORM_PRD_v0.2.md` | Full product requirements (already produced). Read second. |
| `pipeline.py` | Working v3 audio/video pipeline (Python 3.12, CPU). Founder validated end-to-end. |
| `app.py` | Working v3 Gradio WebUI. Founder used personally. |
| `VALIDATION_LOG.md` | What we built, what we tried, what worked, what didn't. Essential context. |
| `STRATEGIC_REVIEW_DIRECTIVE.md` | Standalone directive for the strategic review Claude Code must do FIRST. |
| `NEXT_STEPS.md` | Ordered actions Claude Code should take, with approval gates. |

**Claude Code's first action:** Read this file fully, then the PRD, then the validation log, then begin section 14 of the PRD (Strategic Review). DO NOT write code until the strategic review is approved by the founder.

---

## 1. Executive summary

We are building **Singify**, a B2B2C voice-AI product whose first vertical is karaoke + AI vocal polish + voice coaching, distributed by singing teachers to their students.

Singify is the first product in a **family of voice-AI products on a shared platform**:

- Singify (singing)
- Speakify (public speaking)
- Teacherly (educators)
- SalesPolish (sales reps)
- PitchPolish (R&D tax presentations)
- LingoPure AI (existing — actor line-reading voice agent)

**The business model is leveraged distribution**, not direct-to-consumer. We sell to professionals (singing teachers, accountants, agents, sales managers) who white-label or include the tool for their own clients. We never sell to end users directly.

**Tonight's session validated the core technical foundation.** The founder built and tested a working pipeline (`pipeline.py` + `app.py`) that:
- Accepts any audio or video file
- Downloads optional YouTube backing tracks (yt-dlp)
- Performs pitch correction (psola + librosa)
- Applies a polish chain (Pedalboard: EQ, compression, reverb, limiter)
- Optionally separates vocals from backing (Demucs)
- Mixes vocal over backing at configurable balance
- Loudness-normalises to -14 LUFS (streaming standard)
- Muxes the final audio onto the original video with proper sync

This runs locally on Windows, Python 3.12, CPU-only. It works.

Claude Code's job is to take this proof-of-concept and architect it into the proper multi-tenant platform described in the PRD, with the strategic review (section 2) as the very first deliverable.

---

## 2. What we learned tonight (essential context)

These are insights from the founder personally using the prototype. They should shape architectural decisions.

### 2.1 Zoom is a bad source for vocal recording

Zoom's noise suppression flattens vocals before our pipeline sees them. The polish chain has nothing to enhance. **Singify must require headphones at record time** and ideally capture from the browser's MediaRecorder API directly, not from Zoom or any other voice-call tool.

**Architectural implication:** Singify v0.1 will need browser-based recording with MediaRecorder, headphone-presence detection (or strong UX nudge), and an explicit warning if the user tries to upload a file that appears to be from Zoom/Teams/etc.

### 2.2 Generic polish presets nudge, they don't transform

The default Pedalboard presets we wrote produce subtle improvements on subtle inputs. To deliver the "wow" reaction users expect, polish settings must be:
- **More aggressive by default** (the `karaoke_hero` and `radio` presets in v3 were added in response to this)
- **Personalised to the user's voice** via the vocal baseline assessment

**Architectural implication:** The vocal baseline feature (section 6 of the PRD) is not a nice-to-have. It's the single most important differentiator. Every polish decision should reference the user's baseline.

### 2.3 The full karaoke flow is the actual product

Tonight the founder went through:
1. Record themselves singing along to YouTube
2. Extract audio from the Zoom video
3. Polish the audio
4. Download the YouTube backing separately
5. Mix vocal + backing manually with ffmpeg
6. Mux onto the video manually with ffmpeg

That whole 7-step sequence is what Singify's "Improve" button must collapse into ONE click. The v3 prototype now does this automatically when the user provides a YouTube URL.

**Architectural implication:** The user journey in the PRD must be a single button press. No multi-step UI. Behind the scenes the pipeline does everything.

### 2.4 The "leveraged distributor" model is the real business

This was the strategic shift of the night. We are not building a consumer karaoke app. We are building a B2B2C platform sold to professionals who distribute to their clients. This dramatically changes:
- CAC (lower)
- ARPU (higher)
- Multi-tenancy (core, not optional)
- White-labeling (v0.1, not v3)
- Voice coach personalisation (must adapt per distributor's pedagogy)

### 2.5 Singify is one vertical of a platform

The same engine powers Speakify, Teacherly, SalesPolish, PitchPolish, and integrates with LingoPure AI. The architecture must allow adding a new vertical in <2 weeks (no core/ engine changes required for a new vertical).

### 2.6 OneDrive Desktop folder syncing is a developer disaster

Tonight wasted ~30 minutes on Windows Desktop / OneDrive Desktop folder confusion. Files appeared and disappeared, paths resolved differently in PowerShell vs Explorer vs Python. This is irrelevant to Singify's architecture but worth noting: **all working folders should be in non-synced paths** (e.g., `C:\voicepolish` or similar). Documentation should warn users / distributors against installing into OneDrive-synced folders if they self-host.

### 2.7 Subprocess calls must use `sys.executable`

A real bug: `subprocess.run(["python", "-m", "demucs", ...])` fails inside a venv because Windows resolves `"python"` to the system Python, not the venv's. Fix: use `sys.executable`. The v3 pipeline does this for both Demucs and yt-dlp calls. **Claude Code must follow this pattern everywhere subprocesses invoke Python tools.**

### 2.8 Video output encoding matters

Default ffmpeg AAC mono output failed to play in Windows Movies & TV. Universal-compatibility settings:
- Audio: AAC stereo, 48 kHz, 192 kbps
- Video: H.264 (copied from source where possible)
- Container: MP4 with `+faststart` flag for streaming

The v3 pipeline uses these settings. Claude Code must continue this pattern.

### 2.9 Loudness normalisation is a winning feature

Adding the `loudnorm=I=-14:TP=-1.5:LRA=11` ffmpeg filter at the end of the pipeline made outputs sound dramatically more "produced" without any further tuning. -14 LUFS is the streaming standard (Spotify, YouTube, Apple Music). This belongs in every Singify output.

---

## 3. What's working right now (the v3 prototype)

**Location on founder's machine:** `C:\voicepolish\`

**Files:**
- `pipeline.py` — 11,327 bytes — all audio/video processing
- `app.py` — 3,841 bytes — Gradio WebUI
- `venv/` — Python 3.12 venv with all deps

**Confirmed working:**
- Input: any audio/video format (.m4a, .mp4, .mp3, .wav, etc.)
- Pipeline: normalize → optional separate → pitch correct → polish → mix → master → mux
- Output: polished audio (WAV) + optional synced video (MP4)
- Server: Gradio at `http://127.0.0.1:7860`
- Performance: ~real-time on CPU (a 5-min song processes in ~5-8 minutes)

**Dependencies installed:**
```
gradio (6.x)
pedalboard
soundfile
librosa (0.11)
numpy
scipy
psola
demucs
yt-dlp
torch (CPU build)
torchaudio
+ system: ffmpeg, sox
```

**Polish presets available:** pop, warm, dry, broadcast, radio, karaoke_hero

**Scales supported:** chromatic, C_major, G_major, D_major, A_major, E_major, F_major, Bb_major, Ab_major, A_minor, E_minor, D_minor, G_minor

---

## 4. What this is NOT yet (the gap from prototype to product)

The v3 prototype is single-user, single-tenant, no auth, no database, no distributor model, no voice coach, no vocal baseline, no in-browser recording.

The PRD describes the platform we need to build:

### Critical gaps to fill

1. **Multi-tenancy** — distributor entity, tenant isolation, per-tenant branding, role-based access
2. **Authentication** — signup, login, ToS acceptance, password reset, distributor admin vs. end-user roles
3. **Vocal baseline assessment** — the 2-minute test that captures range, key, stability, tonal profile. **This is the v0.1 killer feature.**
4. **AI Voice Coach** — analyses performance against the user's baseline, produces specific timestamped feedback. Should reuse LingoPure AI's voice-agent infrastructure if compatible (investigation needed — see PRD section 7).
5. **In-browser recording** — currently only file upload. Must add MediaRecorder-based webcam + mic capture with karaoke lyrics overlay.
6. **YouTube search + embedded playback** — currently the user pastes a URL. Should be: search → pick → embedded karaoke video with lyrics scrolling.
7. **Lyrics + alignment** — LRCLIB integration with WhisperX fallback for word-level timing.
8. **Distributor dashboard** — see students, monitor progress, configure branding.
9. **Storage + sharing** — Supabase signed URLs, 7-day shareable links.
10. **DMCA / legal compliance** — ToS templates, takedown endpoint, "is this a cover" flag.

### What stays the same from prototype

- The polish pipeline (psola, pedalboard, demucs, ffmpeg)
- The polish presets
- The YouTube + yt-dlp pattern for backing tracks
- The loudness normalisation step
- The mux-to-video pattern

These move from `pipeline.py` into `core/audio/` and `core/video/` of the new architecture.

---

## 5. Strategic context Claude Code must consider

**This is the founder's explicit ask.** Before writing any code, Claude Code must do a strategic review covering:

1. How does Singify fit into the existing portfolio (especially LingoPure AI)?
2. Where does the B2B2C distribution model *enhance or reshape* existing strategy?
3. Which existing relationships could be leveraged as distributor pipelines?
4. Is there a cross-product play we haven't yet seen (e.g., licensing the engine to vertical SaaS companies)?
5. What are the risks (brand confusion, cannibalisation, channel conflict, focus dilution)?
6. What strategic adjustments should we make to the PRD OR to existing portfolio strategy?

See `STRATEGIC_REVIEW_DIRECTIVE.md` for the full prompt. This is a 2-4 page written deliverable. Founder reviews and approves before any code is written.

---

## 6. The validation framework

Per founder's standard product process. Five gates:

**Gate A — Founder personal validation (2 weeks)**
Done partially tonight. Engine works. Polish is more subtle than ideal on Zoom-source audio. Founder will continue testing on clean recordings (headphones, voice memo app).

**Gate B — Closed beta with founder's network (4 weeks)**
10 beta students from 1-3 sympathetic singing teachers. 7+ say they'd use it weekly = proceed.

**Gate C — First paid distributor (8 weeks)**
1 paying teacher with 5+ active students. Validates commercial model.

**Gate D — Second vertical (12-16 weeks)**
Architecture proves: ship Speakify or SalesPolish or PitchPolish in <2 weeks of work.

**Gate E — Cross-product distributor (24 weeks)**
A distributor uses both Singify and LingoPure with their end users. Validates platform vision.

---

## 7. Tonight's real product insights to bake into v0.1

In addition to the PRD:

- **Headphone detection / strong nudge before recording starts** — Zoom proved this matters
- **Aggressive default polish presets** — subtle is invisible; users need to *hear* the improvement
- **Vocal baseline assessment is v0.1 critical, not deferred**
- **Loudness normalisation always on** — -14 LUFS streaming target
- **Auto-transpose karaoke to user's comfortable key** based on baseline
- **Voice coach feedback must reference baseline data**, not generic targets
- **Backing track stays clean** — only the vocal gets pitch-corrected and polished
- **Outputs must be universally compatible** — AAC stereo 48kHz, +faststart, etc.
- **Subprocess calls use `sys.executable`** to respect venv
- **Working folder outside OneDrive-synced paths**

---

## 8. What Claude Code's first session should produce

In order, with approval gates:

1. **Read this entire package.** Confirm understanding in writing.
2. **Request:** founder's existing strategy materials (business model docs, LingoPure architecture, current revenue structure, 12-month plan). Wait for them.
3. **Read** the strategy materials and LingoPure code.
4. **Produce** the Strategic Review Document per `STRATEGIC_REVIEW_DIRECTIVE.md`. 2-4 pages. Founder approves.
5. **Propose** any PRD adjustments based on review findings. Founder approves.
6. **Propose** the final scaffold tree (refining PRD section 5.3). Founder approves.
7. **Propose** the LingoPure integration approach. Founder approves.
8. **Propose** refined v0.1 acceptance criteria. Founder approves.
9. **Then and only then:** begin scaffolding. Build in PRD section 5.3 order.

If at any point Claude Code is uncertain about a cross-product reuse decision, ask. Do not guess.

---

## 9. What Claude Code MUST NOT do

- Skip the strategic review (section 14 of PRD, plus `STRATEGIC_REVIEW_DIRECTIVE.md`)
- Treat Singify as a consumer product. It is B2B2C.
- Write any code before founder approves scaffold + acceptance criteria
- Introduce paid API dependencies without flagging (v0.1 budget: $50/mo total)
- Refactor LingoPure source — read only
- Build features outside v0.1 scope listed in PRD section 3.5
- Use `"python"` as a subprocess argument — always `sys.executable`
- Save working files into OneDrive-synced folders (Desktop, Documents, Pictures on Windows)
- Output video files with mono AAC — always stereo 48kHz with `+faststart`
- Apply pitch correction or polish to backing tracks — only to vocals
- Build single-tenant. Multi-tenancy is core from day 1.

---

## 10. Files included in this handoff

The founder will provide Claude Code with:

| File | Status | Notes |
|---|---|---|
| `README_HANDOFF.md` | This file | Master orientation |
| `SINGIFY_PLATFORM_PRD_v0.2.md` | Already drafted | The full PRD |
| `pipeline.py` (v3) | Working code | Port to `core/audio/` + `core/video/` |
| `app.py` (v3) | Working code | Reference UI; will be replaced by proper React/Next app eventually but Gradio is acceptable for v0.1 |
| `VALIDATION_LOG.md` | This document | What we tried and learned |
| `STRATEGIC_REVIEW_DIRECTIVE.md` | Pending — Claude Code can produce | The standalone strategic review prompt |
| `NEXT_STEPS.md` | Pending — Claude Code can produce | Ordered build sequence |
| LingoPure AI source | Founder to provide | Required for integration assessment |
| Business model docs | Founder to provide | Required for strategic review |

---

## 11. Closing note from the founder

> "We built a working tool tonight. We validated the foundation. We scoped a platform. Now I want this to become a real product family that ties our portfolio together. Don't just build what the PRD says — tell me where this changes what we should be doing. That's the most valuable thing you can do for me. After that, scaffold properly. We have time. Get it right."

Claude Code: take this seriously. The strategic review is the founder's highest priority. Compliance with the PRD is the table stake; insight is the real ask.

Begin by reading the PRD next.

---

**End of handoff package master document.**
