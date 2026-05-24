# Validation Log — Singify v0 Build Session

**Session:** May 24, 2026 (Saturday evening into Sunday morning), Singapore
**Duration:** ~5 hours
**Founder:** Dennis
**Goal at start:** "I want to record myself singing and have an AI improve it."
**Goal at end:** Working prototype + full product spec + business model for a multi-tenant voice-AI platform.

This document captures what was tried, what failed, what succeeded, and what was learned. Claude Code should read this before architecting v0.1 to avoid repeating the same mistakes.

---

## 1. Market scan (Phase 1, ~30 min)

Surveyed existing products for AI singing improvement:

| Tool | What it does | Why we rejected it as the build target |
|---|---|---|
| Antares Auto-Tune | Industry-standard pitch correction | Pro tool, not consumer-facing, no video sync |
| Celemony Melodyne | Surgical pitch + timing edits | Same as above |
| Voloco | Mobile auto-tune | Closed app, no extensibility |
| Moises.ai | Stem separation + processing | Useful component, not full pipeline |
| LANDR Vocal Studio | AI mixing | No video, no coach, no multi-tenancy |
| iZotope Nectar 4 | ML-suggested vocal chains | Pro tool, expensive |
| Kits.AI | Voice conversion via cloned models | Works but expensive, no video sync, no coach |
| AICoverGen | Open-source RVC karaoke maker | Broken on Python 3.12 (fairseq archived) |
| Applio | Newer RVC fork | Untested by us, likely same fairseq issue |
| Smule / StarMaker | Karaoke apps | Locked ecosystems, no AI coach, no polish |

**Conclusion at the time:** Build our own. None of these do the full loop (record → polish → video sync → share → coach) for casual users.

---

## 2. First attempt: AICoverGen on Colab (Phase 2, ~60 min)

Tried to use AICoverGen (the most popular open-source RVC karaoke tool) via Google Colab.

**Sequence of failures:**

1. Notebook ran the install cell. Several silent dependency conflicts in the log.
2. WebUI cell failed: `ModuleNotFoundError: No module named 'sox'`
3. Installed `sox`. Re-ran. Failed: `ModuleNotFoundError: No module named 'yt_dlp'`
4. Installed `yt-dlp`. Re-ran. Failed: `NameError: name 'codecs' is not defined` (the notebook had obfuscated the script path with rot_13 but didn't import `codecs`).
5. Hardcoded the path (`!python src/webui.py --share`). Failed: wrong working directory.
6. Fixed cd. Failed: `ModuleNotFoundError: No module named 'pedalboard'`
7. Pre-emptively installed `pedalboard praat-parselmouth faiss-cpu onnxruntime-gpu fairseq pyworld torchcrepe ffmpeg-python`.
8. Re-ran. Failed deeper: 
   ```
   ValueError: mutable default <class 'fairseq.dataclass.configs.CommonConfig'> 
   for field common is not allowed: use default_factory
   ```

**Root cause:** `fairseq` 0.12.2 (the version AICoverGen depends on) uses Python dataclass syntax that Python 3.12 (Colab's current default) rejects. Meta archived fairseq. AICoverGen depends on the broken version. No fix available short of downgrading Python or patching fairseq manually.

**Decision:** Abandon AICoverGen. The whole RVC ecosystem is currently broken on modern Python. Pivot to a different architecture.

**Lesson for Claude Code:** Do NOT use fairseq or any package depending on it. Do NOT use `rvc-python` (same dependency chain). Use the modern pure-Python stack: librosa, psola, pedalboard, demucs, ffmpeg.

---

## 3. Strategic pivot: pitch correction + polish instead of voice conversion (Phase 3, ~30 min)

Reframed the problem:

- **What RVC offers:** "Sing as Freddie Mercury" — voice timbre conversion. Hard tech, fragile ecosystem.
- **What pitch correction + polish offers:** "Sing as a better version of yourself" — pitch fixes + mix engineering. Mature, maintained tech.

For "fun, share with friends," the second is enough and infinitely more reliable. The first can be added later via paid APIs (ElevenLabs, etc.) when the ecosystem stabilises.

**Decision:** Build VoicePolish — pitch correction + polish, no voice conversion.

---

## 4. VoicePolish v2 on Colab (Phase 4, ~45 min)

Built a clean Gradio notebook with the new stack:

- `librosa.pyin` for pitch detection
- `psola.vocode` for pitch correction
- `pedalboard` for mix chain (EQ, compression, reverb, limiter)
- `demucs` for optional vocal separation
- `ffmpeg` for I/O and video mux

**Sequence of issues:**

1. Notebook upload format issue: JSON corruption on first upload. Rebuilt with nbformat library to guarantee validity.
2. Re-uploaded. Cells installed correctly.
3. WebUI cell: `gradio==4.44.0` pinned version, but Colab's pre-installed huggingface_hub had moved past `HfFolder` import. Bumped gradio to latest.
4. WebUI launched briefly. URL appeared: `https://138d94232de94f60bb.gradio.live`
5. User opened the URL. UI loaded. Uploaded `audio1008775981.m4a` (4:42 Zoom recording of singing).
6. Clicked Generate. Process started.
7. **Colab runtime crashed mid-processing.** Disconnected from the assigned VM in us-west1.
8. Colab reassigned a new VM in asia-southeast1 (because user is in Singapore). All install state was lost.
9. Repeated install + launch. Same crash. Three runtime crashes in succession.

**Root cause:** Free-tier Colab in Asia regions is heavily oversubscribed. VMs get reclaimed aggressively, especially for long-running Gradio sessions.

**Decision:** Abandon Colab. Move to local Windows install.

**Lesson for Claude Code:** Free Colab is not a viable hosting target for Singify. For self-hosted distributors, plan for either local install (Mac/Windows/Linux) or a managed hosted version on Render / Hugging Face Spaces / similar. Free Colab works only for one-off demos.

---

## 5. Local Windows install (Phase 5, ~45 min)

The founder's setup:
- Windows 11
- Python 3.12.10 (already installed)
- Intel Iris Xe integrated graphics (no NVIDIA GPU — CPU processing only)
- ffmpeg already installed and on PATH
- OneDrive sync active on Desktop folder

**Sequence:**

1. Created venv at `C:\Users\denni\Desktop\voicepolish\venv`
2. Installed deps:
   ```
   pip install torch --index-url https://download.pytorch.org/whl/cpu
   pip install gradio pedalboard soundfile librosa numpy scipy psola demucs
   ```
3. Created `pipeline.py` and `app.py` by direct Notepad paste (downloading files from chat had path issues with OneDrive folder).
4. Ran `python app.py`. Launched at `http://127.0.0.1:7860`.
5. Dropped the Zoom .m4a in. Clicked Generate with default settings (chromatic scale, 0.7 strength, pop preset).
6. Process completed in ~5 minutes. Output: `polished.wav`.

**Result:** Tool works end-to-end. But...

**Founder's reaction after listening:** "Doesn't sound much different."

---

## 6. Why the polish was subtle (Phase 6, ~20 min)

Three likely causes diagnosed:

### 6.1 Zoom's noise suppression flattened the source

Zoom heavily processes its outgoing audio: noise gate, compression, EQ. By the time the audio reached our pipeline, vocal dynamics were already compressed flat. Pedalboard's compressor had nothing to compress further. The polish chain works best on relatively raw vocal — Zoom's pre-processing left almost no room for enhancement.

**Architectural implication:** Singify must NOT accept Zoom/Teams/etc. recordings as ideal input. Browser MediaRecorder API or direct file upload from voice memo apps gives much cleaner source.

### 6.2 Generic polish settings don't transform; they nudge

The default presets (pop, warm, dry, broadcast) were tasteful studio defaults. To produce a "wow" reaction on amateur vocals, presets need to be more aggressive.

**Response:** Added two new presets in v3: `radio` (heavy compression, aggressive EQ) and `karaoke_hero` (designed specifically for amateur singing — heavy compression to even out dynamics, big presence boost, lush reverb).

### 6.3 Pitch correction at 0.7 is intentionally subtle

PSOLA-based correction nudges flat/sharp notes by a fraction of a semitone. Subtle by design — preserves natural vocal character. To hear the dramatic effect (the "T-Pain" sound), strength must be 1.0 and scale must match the song's actual key.

### 6.4 The recording was vocal + karaoke bleed through speakers

The user listened to the YouTube karaoke through laptop speakers. The mic captured BOTH the user's voice AND the karaoke backing. This contaminated the source signal. The pitch detector confused the user's voice with the YouTube track's vocal.

**The lesson:** ALWAYS USE HEADPHONES. This is the single most important UX message Singify must convey to users before recording starts.

**Architectural implication:** Singify v0.1 should detect (or strongly nudge for) headphones before record start. The browser's `getUserMedia` constraints can request `echoCancellation: false` and `noiseSuppression: false` to give us a clean signal, but only if the user has headphones — otherwise speaker bleed defeats the purpose.

---

## 7. Vocal baseline insight (Phase 7, ~15 min)

The founder, while listening to v2 outputs, said:

> "the voice coach should get the student to sing a base test sing to establish current pitch, range, comfortable scale etc so there is a baseline — then the AI can present the adjustments to best fit the voice"

This was a major insight. Every other karaoke/polish tool applies generic effects to every voice. **Singify's wedge is knowing the voice first, then choosing corrections to fit.**

**Captured for the PRD:**

A 2-minute baseline assessment captures:
1. **Range:** highest and lowest comfortable notes
2. **Comfortable key:** what key the user naturally sings in
3. **Pitch stability:** held-note variance and vibrato style
4. **Tonal profile:** spectral character at three energy levels

**What baseline enables:**
- Auto-transpose karaoke tracks to user's comfortable key
- Pitch correction parameters tuned to user's stability
- Polish presets selected by tonal character
- Voice coach feedback referencing actual capabilities ("this peaks at A4 — your comfortable max is G4, try dropping the chorus an octave")
- Measurable progress tracking over time

**Architectural implication:** Baseline lives in `core/voice_profile/` and is reused across all verticals (Speakify, Teacherly, SalesPolish, etc.) with vertical-specific variants. Voice Coach feedback must always reference baseline data, not generic targets.

---

## 8. Business model insight: leveraged distribution (Phase 8, ~30 min)

Founder articulated the business model:

> "we don't intend to sell to end users. We build for the leveraged distributors — accountants for R&D tax bracket who white-label, agents for actors, singing teachers for students, etc. They set up an account and allow their clients to use under their banner for a fee or for free."

This is a B2B2C platform play, not a consumer SaaS. Implications:

| Aspect | Direct-to-consumer | Leveraged distribution |
|---|---|---|
| Customer | End user | Distributor (professional) |
| CAC | $30-150 per user | One distributor = 20-200 users |
| ARPU | $5-10/mo per user | $50-250/mo per distributor |
| Churn | High (consumer SaaS) | Lower (workflow integration) |
| Distribution | TikTok ads, SEO, viral | Industry-specific outreach |
| Moat | Network effects (slow) | Workflow + white-label switching cost |
| Regulatory burden | We carry it | Distributors carry their own |

**Decision:** Singify is a multi-tenant B2B2C platform. The first vertical (singing teachers → students) is the wedge. Same engine extends to Speakify (presenters), Teacherly (educators), SalesPolish (sales reps), PitchPolish (R&D tax), and integrates with LingoPure AI (talent agents → actors).

**Architectural implication:** Multi-tenancy is core, not a v3 feature. White-labeling is v0.1, not premium. Distributor onboarding flow is the primary sales motion.

---

## 9. v3 build (Phase 9, ~45 min)

Built v3 of pipeline.py and app.py with:

1. **`sys.executable` fix** for subprocess calls (real bug from v2)
2. **YouTube backing track download** via yt-dlp (with URL sanitisation)
3. **Two new polish presets:** `radio` and `karaoke_hero`
4. **Configurable mix balance** (vocal gain, backing gain)
5. **Loudness normalisation** (EBU R128 to -14 LUFS)
6. **Universally compatible video output** (AAC stereo, 48kHz, +faststart)
7. **Extended scale list** (added Bb, Ab major; G minor)

**OneDrive Desktop disaster:** while moving the new files into place, ran into 30 minutes of confusion because the founder's Desktop is OneDrive-synced. PowerShell, ffmpeg, and File Explorer each saw a different physical folder. Files appeared in directory listings but couldn't be opened (cloud-only placeholders).

**Resolution:** Moved entire project to `C:\voicepolish` (outside OneDrive). All confusion stopped immediately.

**Lesson for Claude Code:** documentation for self-hosting distributors must warn against installing into OneDrive/iCloud/Google Drive synced paths. For the hosted version, this doesn't apply.

---

## 10. v3 validation (Phase 10, ~30 min)

Launched v3. Ran the full karaoke pipeline:

- Input: Zoom .mp4 video
- YouTube URL: karaoke version of "I Just Called To Say I Love You"
- Settings: C_major, 0.8 correction, karaoke_hero preset
- Mix balance: default (+2 vocal, -3 backing)
- Loudness normalisation: ON

**Result:** Pipeline completed successfully. Output: polished karaoke video with:
- User's pitch-corrected voice
- Clean YouTube backing track
- Both mixed at proper levels
- Loudness mastered
- Synced to original video

Founder confirmed: "it works, we can work on the settings available and what to do with it now."

The foundation is validated. The product can be built on top.

---

## 11. Open questions surfaced tonight

For the founder to resolve, with Claude Code's help if needed:

1. **Brand architecture:** Are Singify and LingoPure sibling products under an umbrella brand, or independent products sharing infra?
2. **Voice Coach in v0.1:** Text-only feedback, or already voice-enabled (using LingoPure infra)?
3. **First beta distributor:** Specific singing teacher in mind, or open recruitment?
4. **Geographic launch:** Singapore only initially, or global from day 1?
5. **Privacy stance:** Do students see teacher's view, or only teacher sees student progress?
6. **Founder mode:** Singify usable as standalone tool for founder personally, independent of distributor flow, for v0 testing?

These are explicit in the PRD's section 13. Claude Code should NOT decide these unilaterally.

---

## 12. Engineering inheritances for Claude Code

These are the patterns from the v3 prototype that should carry forward:

```python
# Subprocess calls invoke venv-correct Python
import sys
cmd = [sys.executable, "-m", "yt_dlp", ...]

# ffmpeg loudness normalisation as the mastering step
cmd = ["ffmpeg", "-i", input_wav,
       "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", ...]

# Universally compatible video output
cmd = ["ffmpeg", "-i", video, "-i", audio,
       "-c:v", "copy",
       "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-ar", "48000",
       "-movflags", "+faststart", out]

# YouTube URL sanitisation before passing to yt-dlp
import re
m = re.search(r"(?:v=|youtu\.be/|/embed/|/shorts/)([A-Za-z0-9_-]{11})", url)

# Polish chain via Pedalboard
from pedalboard import Pedalboard, HighpassFilter, Compressor, Reverb, Limiter
board = Pedalboard([HighpassFilter(...), Compressor(...), ...])
processed = board(audio, sample_rate)

# Pitch correction
import psola
corrected = psola.vocode(audio, sample_rate=sr,
                         target_pitch=target_f0, fmin=fmin, fmax=fmax)

# Vocal separation via Demucs CLI
cmd = [sys.executable, "-m", "demucs",
       "--two-stems=vocals", "-n", "htdemucs", input_wav]
```

These are tested, working, and ready to port into `core/audio/` and `core/video/` modules.

---

## 13. What the founder wants Claude Code to deliver first

In priority order:

1. **A strategic review** of how Singify fits/changes the existing portfolio, with sharp honest analysis — NOT a compliance summary.
2. **A scaffold proposal** for the multi-tenant platform architecture, ported from the v3 prototype.
3. **An assessment** of LingoPure AI integration: should Singify's voice coach reuse LingoPure's voice agent stack, or stay independent?
4. **Refined acceptance criteria** for v0.1 with measurable definitions of "done."

All four are pre-code deliverables. Founder approves each before scaffolding starts.

---

## 14. End of validation log

Claude Code: read this, understand what was tried and why, and respect the patterns established. Then move on to the strategic review.
