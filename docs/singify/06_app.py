"""VoicePolish v3 Gradio WebUI — with YouTube karaoke mixing."""

import gradio as gr
from pipeline import process, SCALE_INTERVALS, POLISH_PRESETS


def run_pipeline(
    input_file, youtube_url, use_separation,
    scale, correction_strength, polish_preset,
    vocal_gain_db, backing_gain_db, apply_loudness_norm,
):
    if input_file is None:
        return None, None, None, "❌ Upload a file first."

    # If both YouTube URL and separation are on, prefer YouTube (cleaner source)
    yt = youtube_url.strip() if youtube_url else None
    sep = bool(use_separation) and not yt

    try:
        result = process(
            input_file=input_file,
            youtube_backing_url=yt,
            use_separation=sep,
            scale=scale,
            correction_strength=float(correction_strength),
            polish_preset=polish_preset,
            vocal_gain_db=float(vocal_gain_db),
            backing_gain_db=float(backing_gain_db),
            apply_loudness_norm=bool(apply_loudness_norm),
        )
        parts = ["✅ Done."]
        if result["backing_path"]:
            parts.append(f"Backing source: {result['backing_path']}")
        parts.append(f"Polished vocal: {result['polished_audio']}")
        parts.append(f"Final audio: {result['final_audio']}")
        if result["final_video"]:
            parts.append(f"Final video: {result['final_video']}")
        return (
            result["final_audio"],
            result["polished_audio"],
            result["final_video"],
            "\n".join(parts),
        )
    except Exception as e:
        import traceback
        return None, None, None, f"❌ {type(e).__name__}: {e}\n\n{traceback.format_exc()}"


with gr.Blocks(title="VoicePolish v3", theme=gr.themes.Soft()) as app:
    gr.Markdown("# 🎤 VoicePolish v3")
    gr.Markdown(
        "Drop any audio or video file. Optionally provide a YouTube karaoke URL "
        "to mix your polished vocal over the original backing track. "
        "Video in → polished karaoke video out, audio synced."
    )

    with gr.Row():
        with gr.Column():
            input_file = gr.File(
                label="Input audio or video (any format)",
                file_types=["audio", "video",
                            ".m4a", ".mp3", ".wav", ".flac", ".ogg",
                            ".mp4", ".mov", ".mkv", ".webm"],
                type="filepath",
            )

            youtube_url = gr.Textbox(
                label="YouTube karaoke URL (optional)",
                placeholder="https://www.youtube.com/watch?v=...",
                info="If provided, downloads this track as backing. "
                     "Mix your polished vocal over it. Leave empty if you only want vocal polish.",
            )

            use_sep = gr.Checkbox(
                label="OR: extract backing from your recording (Demucs)",
                value=False,
                info="Use only if you recorded yourself singing over audible music "
                     "and don't have the original track. Slower, lower quality than YouTube URL.",
            )

            scale = gr.Dropdown(
                label="Target scale",
                choices=list(SCALE_INTERVALS.keys()),
                value="chromatic",
                info='"chromatic" = subtle, snaps to nearest semitone. Pick a key for stronger tuning.',
            )

            correction = gr.Slider(
                0, 1, value=0.7, step=0.05,
                label="Correction strength",
                info="0 = your original pitch. 1 = full T-Pain. 0.5–0.8 sounds natural.",
            )

            preset = gr.Radio(
                choices=list(POLISH_PRESETS.keys()),
                value="pop",
                label="Polish preset",
                info="'karaoke_hero' and 'radio' are most aggressive. "
                     "'dry' is most subtle.",
            )

            with gr.Accordion("Mix balance (used when backing track is present)", open=False):
                vocal_gain = gr.Slider(
                    -12, 12, value=2, step=0.5,
                    label="Vocal gain (dB)",
                    info="Positive = louder vocal. Default +2 dB.",
                )
                backing_gain = gr.Slider(
                    -18, 6, value=-3, step=0.5,
                    label="Backing track gain (dB)",
                    info="Negative = quieter backing. Default -3 dB sits the backing nicely.",
                )

            with gr.Accordion("Mastering", open=False):
                loudness_norm = gr.Checkbox(
                    label="Loudness normalise to -14 LUFS (streaming-ready)",
                    value=True,
                    info="Matches Spotify/YouTube/Apple Music target loudness.",
                )

            run_btn = gr.Button("✨ Generate", variant="primary", size="lg")

        with gr.Column():
            out_audio = gr.Audio(label="Final audio (mixed if backing track present)", type="filepath")
            out_vocal = gr.Audio(label="Polished vocal only", type="filepath")
            out_video = gr.Video(label="Final video (if input was video)")
            status = gr.Textbox(label="Status", lines=10, interactive=False)

    run_btn.click(
        run_pipeline,
        inputs=[input_file, youtube_url, use_sep,
                scale, correction, preset,
                vocal_gain, backing_gain, loudness_norm],
        outputs=[out_audio, out_vocal, out_video, status],
    )


if __name__ == "__main__":
    app.launch()
