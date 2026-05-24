"""
VoicePolish v3 — pitch correction + polish + karaoke mixing.

Improvements over v2:
  - sys.executable fix for venv-correct subprocess calls
  - Optional YouTube backing-track download (yt-dlp)
  - Vocal-vs-backing mix balance with configurable gains
  - Cleaner error reporting from subprocesses
  - Loudness normalisation pass on the final mix
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import librosa
import soundfile as sf
import psola
from pedalboard import (
    Pedalboard, HighpassFilter, Compressor,
    PeakFilter, Reverb, Limiter, Gain
)
from pedalboard.io import AudioFile


# ---------- Scale definitions ----------

SCALE_INTERVALS = {
    "C_major":   [0, 2, 4, 5, 7, 9, 11],
    "G_major":   [7, 9, 11, 0, 2, 4, 6],
    "D_major":   [2, 4, 6, 7, 9, 11, 1],
    "A_major":   [9, 11, 1, 2, 4, 6, 8],
    "E_major":   [4, 6, 8, 9, 11, 1, 3],
    "F_major":   [5, 7, 9, 10, 0, 2, 4],
    "Bb_major":  [10, 0, 2, 3, 5, 7, 9],
    "Ab_major":  [8, 10, 0, 1, 3, 5, 7],
    "A_minor":   [9, 11, 0, 2, 4, 5, 7],
    "E_minor":   [4, 6, 7, 9, 11, 0, 2],
    "D_minor":   [2, 4, 5, 7, 9, 10, 0],
    "G_minor":   [7, 9, 10, 0, 2, 3, 5],
    "chromatic": list(range(12)),
}


# ---------- Pitch helpers ----------

def closest_pitch_in_scale(f0_hz, scale_pcs):
    if np.isnan(f0_hz) or f0_hz <= 0:
        return np.nan
    midi = librosa.hz_to_midi(f0_hz)
    pc = int(round(midi)) % 12
    octave = int(round(midi)) // 12
    distances = [(abs(pc - s), s) for s in scale_pcs] + \
                [(abs(pc - s - 12), s) for s in scale_pcs] + \
                [(abs(pc - s + 12), s) for s in scale_pcs]
    distances.sort()
    target_pc = distances[0][1]
    target_midi = octave * 12 + target_pc
    candidates = [target_midi - 12, target_midi, target_midi + 12]
    target_midi = min(candidates, key=lambda m: abs(m - midi))
    return librosa.midi_to_hz(target_midi)


# ---------- Stage 1: Normalise input ----------

def normalize_input(input_path, work_dir):
    """Accept any audio/video file, output 16-bit 44.1kHz mono WAV. Detect video."""
    input_path = str(input_path)
    ext = Path(input_path).suffix.lower()
    video_exts = {".mp4", ".mov", ".mkv", ".webm", ".avi"}
    is_video = ext in video_exts
    out_wav = os.path.join(work_dir, "input_normalized.wav")
    cmd = ["ffmpeg", "-y", "-i", input_path, "-vn",
           "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "1", out_wav]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg failed normalising input:\n{r.stderr}")
    return out_wav, (input_path if is_video else None)


# ---------- Stage 2: Optional Demucs separation ----------

def separate_vocal(input_wav, work_dir):
    """Use Demucs to split vocals from backing. Uses sys.executable (venv-correct)."""
    sep_dir = os.path.join(work_dir, "separated")
    os.makedirs(sep_dir, exist_ok=True)
    cmd = [sys.executable, "-m", "demucs", "--two-stems=vocals",
           "-o", sep_dir, "-n", "htdemucs", input_wav]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"demucs failed:\n{r.stderr}")
    basename = Path(input_wav).stem
    vocals = os.path.join(sep_dir, "htdemucs", basename, "vocals.wav")
    backing = os.path.join(sep_dir, "htdemucs", basename, "no_vocals.wav")
    if not os.path.exists(vocals):
        raise RuntimeError(f"Vocals not found at {vocals}")
    return vocals, backing


# ---------- Stage 3: YouTube backing track download ----------

def _sanitize_youtube_url(url):
    """Strip tracking params; keep just the canonical watch URL."""
    if not url:
        return None
    url = url.strip()
    m = re.search(r"(?:v=|youtu\.be/|/embed/|/shorts/)([A-Za-z0-9_-]{11})", url)
    if not m:
        return url
    return f"https://www.youtube.com/watch?v={m.group(1)}"


def download_youtube_backing(youtube_url, work_dir):
    """Download YouTube audio via yt-dlp. Returns WAV path."""
    clean_url = _sanitize_youtube_url(youtube_url)
    if not clean_url:
        raise ValueError("No YouTube URL provided")
    
    out_template = os.path.join(work_dir, "backing.%(ext)s")
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "-x", "--audio-format", "wav",
        "--audio-quality", "0",
        "-o", out_template,
        "--no-playlist",
        "--no-warnings",
        clean_url,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(
            f"yt-dlp failed downloading backing track.\n"
            f"URL: {clean_url}\n"
            f"stderr:\n{r.stderr}"
        )
    
    # yt-dlp writes "backing.wav" when --audio-format wav is set
    expected = os.path.join(work_dir, "backing.wav")
    if not os.path.exists(expected):
        # Fallback: look for whatever file it produced
        candidates = list(Path(work_dir).glob("backing.*"))
        if not candidates:
            raise RuntimeError("yt-dlp ran but no output file was found")
        expected = str(candidates[0])
    return expected


# ---------- Stage 4: Pitch correction ----------

def correct_pitch(input_wav, work_dir, scale="chromatic", correction_strength=1.0):
    audio, sr = librosa.load(input_wav, sr=None, mono=True)
    fmin = librosa.note_to_hz("C2")
    fmax = librosa.note_to_hz("C7")
    f0, _, _ = librosa.pyin(
        audio, fmin=fmin, fmax=fmax, sr=sr,
        frame_length=2048, hop_length=256,
    )
    scale_pcs = SCALE_INTERVALS.get(scale, SCALE_INTERVALS["chromatic"])
    target_f0 = np.array([
        closest_pitch_in_scale(p, scale_pcs) if not np.isnan(p) else np.nan
        for p in f0
    ])
    blended_f0 = np.where(
        np.isnan(f0) | np.isnan(target_f0),
        f0,
        f0 * (1 - correction_strength) + target_f0 * correction_strength,
    )
    corrected = psola.vocode(
        audio, sample_rate=int(sr),
        target_pitch=blended_f0, fmin=fmin, fmax=fmax,
    )
    out_path = os.path.join(work_dir, "tuned.wav")
    sf.write(out_path, corrected, sr)
    return out_path


# ---------- Stage 5: Polish chain ----------

POLISH_PRESETS = {
    "pop": Pedalboard([
        HighpassFilter(cutoff_frequency_hz=80),
        Compressor(threshold_db=-18, ratio=3, attack_ms=5, release_ms=80),
        PeakFilter(cutoff_frequency_hz=200, gain_db=-2, q=1.0),
        PeakFilter(cutoff_frequency_hz=3000, gain_db=2.5, q=0.7),
        PeakFilter(cutoff_frequency_hz=10000, gain_db=2, q=0.7),
        Reverb(room_size=0.25, wet_level=0.12, dry_level=0.88, damping=0.5),
        Limiter(threshold_db=-1, release_ms=100),
        Gain(gain_db=0),
    ]),
    "warm": Pedalboard([
        HighpassFilter(cutoff_frequency_hz=70),
        Compressor(threshold_db=-20, ratio=2.5, attack_ms=10, release_ms=120),
        PeakFilter(cutoff_frequency_hz=250, gain_db=1.5, q=0.8),
        PeakFilter(cutoff_frequency_hz=4000, gain_db=1.5, q=0.6),
        Reverb(room_size=0.45, wet_level=0.18, dry_level=0.82, damping=0.6),
        Limiter(threshold_db=-1.5),
    ]),
    "dry": Pedalboard([
        HighpassFilter(cutoff_frequency_hz=80),
        Compressor(threshold_db=-16, ratio=3.5),
        Limiter(threshold_db=-1),
    ]),
    "broadcast": Pedalboard([
        HighpassFilter(cutoff_frequency_hz=100),
        Compressor(threshold_db=-15, ratio=4, attack_ms=3, release_ms=60),
        PeakFilter(cutoff_frequency_hz=2500, gain_db=3, q=0.6),
        Limiter(threshold_db=-0.5),
    ]),
    "radio": Pedalboard([
        HighpassFilter(cutoff_frequency_hz=100),
        Compressor(threshold_db=-24, ratio=6, attack_ms=2, release_ms=40),
        PeakFilter(cutoff_frequency_hz=180, gain_db=-3, q=1.2),
        PeakFilter(cutoff_frequency_hz=3500, gain_db=4, q=0.6),
        PeakFilter(cutoff_frequency_hz=12000, gain_db=3, q=0.5),
        Reverb(room_size=0.2, wet_level=0.1, dry_level=0.9, damping=0.6),
        Limiter(threshold_db=-0.3, release_ms=60),
    ]),
    "karaoke_hero": Pedalboard([
        HighpassFilter(cutoff_frequency_hz=90),
        Compressor(threshold_db=-22, ratio=5, attack_ms=3, release_ms=80),
        PeakFilter(cutoff_frequency_hz=300, gain_db=-2, q=1.0),
        PeakFilter(cutoff_frequency_hz=3000, gain_db=3.5, q=0.7),
        PeakFilter(cutoff_frequency_hz=8000, gain_db=2.5, q=0.6),
        Reverb(room_size=0.55, wet_level=0.22, dry_level=0.78, damping=0.5),
        Limiter(threshold_db=-0.8),
    ]),
}


def polish_vocal(input_wav, work_dir, preset="pop"):
    board = POLISH_PRESETS.get(preset, POLISH_PRESETS["pop"])
    out_path = os.path.join(work_dir, "polished.wav")
    with AudioFile(input_wav) as f:
        audio = f.read(f.frames)
        sr = f.samplerate
    processed = board(audio, sr)
    with AudioFile(out_path, "w", sr, processed.shape[0]) as f:
        f.write(processed)
    return out_path


# ---------- Stage 6: Vocal + backing mix ----------

def mix_with_backing(
    vocal_path,
    backing_path,
    work_dir,
    vocal_gain_db=2.0,
    backing_gain_db=-3.0,
):
    """Mix the polished vocal over a backing track with configurable balance."""
    out_path = os.path.join(work_dir, "mixed.wav")
    v_lin = 10 ** (vocal_gain_db / 20)
    b_lin = 10 ** (backing_gain_db / 20)
    cmd = [
        "ffmpeg", "-y",
        "-i", vocal_path, "-i", backing_path,
        "-filter_complex",
        (
            f"[0:a]volume={v_lin:.4f},aresample=44100[v];"
            f"[1:a]volume={b_lin:.4f},aresample=44100[b];"
            f"[v][b]amix=inputs=2:duration=longest:normalize=0[a]"
        ),
        "-map", "[a]", "-ac", "2", "-ar", "44100",
        out_path,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"mix failed:\n{r.stderr}")
    return out_path


# ---------- Stage 7: Loudness normalisation ----------

def loudness_normalize(input_wav, work_dir, target_lufs=-14):
    """EBU R128 normalisation. -14 LUFS matches Spotify/YouTube loudness."""
    out_path = os.path.join(work_dir, "mastered.wav")
    cmd = [
        "ffmpeg", "-y", "-i", input_wav,
        "-af", f"loudnorm=I={target_lufs}:TP=-1.5:LRA=11",
        "-ar", "44100", "-ac", "2",
        out_path,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        # Non-fatal: return original if normalisation fails
        return input_wav
    return out_path


# ---------- Stage 8: Mux audio onto video ----------

def mux_audio_to_video(video_path, audio_path, work_dir):
    """Replace video's audio with new audio. Uses universally compatible AAC stereo 48k."""
    out_path = os.path.join(work_dir, "final_video.mp4")
    cmd = [
        "ffmpeg", "-y", "-i", video_path, "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-ar", "48000",
        "-map", "0:v:0", "-map", "1:a:0", "-shortest",
        "-movflags", "+faststart",
        out_path,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"mux failed:\n{r.stderr}")
    return out_path


# ---------- Top-level orchestrator ----------

def process(
    input_file,
    use_separation=False,
    youtube_backing_url=None,
    scale="chromatic",
    correction_strength=1.0,
    polish_preset="pop",
    vocal_gain_db=2.0,
    backing_gain_db=-3.0,
    apply_loudness_norm=True,
    work_dir=None,
):
    """
    Full pipeline.
    
    Backing track sourcing priority:
      1. youtube_backing_url provided -> download via yt-dlp
      2. use_separation=True -> demucs extracts backing from input
      3. Neither -> output is polished vocal only
    """
    work_dir = work_dir or tempfile.mkdtemp(prefix="voicepolish_")
    os.makedirs(work_dir, exist_ok=True)

    # 1. Normalise input
    wav_path, video_path = normalize_input(input_file, work_dir)

    # 2. Resolve backing track source
    backing_path = None
    source_for_tuning = wav_path

    if youtube_backing_url:
        backing_path = download_youtube_backing(youtube_backing_url, work_dir)
        # Don't separate; user's vocal is whatever's in input file
    elif use_separation:
        vocal_only, backing_path = separate_vocal(wav_path, work_dir)
        source_for_tuning = vocal_only

    # 3. Pitch correction
    tuned = correct_pitch(
        source_for_tuning, work_dir,
        scale=scale, correction_strength=correction_strength,
    )

    # 4. Polish
    polished = polish_vocal(tuned, work_dir, preset=polish_preset)

    # 5. Mix with backing (if any)
    final_audio = polished
    if backing_path is not None:
        final_audio = mix_with_backing(
            polished, backing_path, work_dir,
            vocal_gain_db=vocal_gain_db,
            backing_gain_db=backing_gain_db,
        )

    # 6. Loudness normalise the final audio
    if apply_loudness_norm:
        final_audio = loudness_normalize(final_audio, work_dir)

    # 7. Mux back to video if input was video
    final_video = None
    if video_path is not None:
        final_video = mux_audio_to_video(video_path, final_audio, work_dir)

    return {
        "normalized_audio": wav_path,
        "tuned_audio": tuned,
        "polished_audio": polished,
        "final_audio": final_audio,
        "final_video": final_video,
        "backing_path": backing_path,
        "work_dir": work_dir,
    }
