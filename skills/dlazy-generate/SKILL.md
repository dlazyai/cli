---
name: dlazy-generate
version: 1.1.1
description: A comprehensive generation skill. Can generate images, videos, and audio by automatically selecting the appropriate dlazy CLI model.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.9","installAlternative":"npx @dlazy/cli@1.0.9","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","files.dlazy.com"]},"openclaw":{"systemPrompt":"When this skill is called, use dlazy <subcommand>."}}
---

# dlazy-generate

[English](./SKILL.md) · [中文](./SKILL-cn.md)


A comprehensive generation skill. Can generate images, videos, and audio by automatically selecting the appropriate dlazy CLI model.

## Trigger Keywords

- generate
- create image, video, audio
- multimodal generation

## Authentication

All requests require a dLazy API key. The recommended way to authenticate is:



```bash

This runs a device-code flow (also works in remote shells) and **automatically saves your API key** to the local CLI config — no manual copy/paste required.

### Alternative: Set the Key Manually

If you already have an API key, you can save it directly:

```bash
dlazy auth set YOUR_API_KEY
```

The CLI saves the key in your user config directory (`~/.dlazy/config.json` on macOS/Linux, `%USERPROFILE%\.dlazy\config.json` on Windows), with file permissions restricted to your OS user account. You can also supply the key per-invocation via the `DLAZY_API_KEY` environment variable.

### Getting Your API Key Manually

1. Sign in or create an account at [dlazy.com](https://dlazy.com)
2. Go to [dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key)
3. Copy the key shown in the API Key section

Each key is scoped to your dLazy organization and can be **rotated or revoked at any time** from the same dashboard.




## About & Provenance

- **CLI source code**: [github.com/dlazyai/cli](https://github.com/dlazyai/cli)
- **Maintainer**: dlazyai
- **npm package**: `@dlazy/cli` (pinned to `1.0.9` in this skill's install spec)
- **Homepage**: [dlazy.com](https://dlazy.com)

You can install on demand without persisting a global binary by running:

```bash
npx @dlazy/cli@1.0.9 <command>
```

Or, if you prefer a global install, the skill's `metadata.clawdbot.install` field declares the exact pinned version (`npm install -g @dlazy/cli@1.0.9`). Review the GitHub source before installing.

## How It Works

This skill is a thin client over the dLazy hosted API. When you invoke it:

- Prompts and parameters you provide are sent to the dLazy API endpoint (`api.dlazy.com`) for inference.
- Any local file paths you pass to image / video / audio fields are uploaded to dLazy's media storage (`files.dlazy.com`) so the model can read them — the same flow as any cloud-based generation API.
- Generated output URLs returned by the API are hosted on `files.dlazy.com`.

This is the standard SaaS pattern; the skill itself does not access network or filesystem resources beyond what the dLazy CLI already handles. See [dlazy.com](https://dlazy.com) for the full service terms.

## Piping Between Commands

Every `dlazy` invocation prints a JSON envelope on stdout. Any flag value can be a **pipe reference** that pulls from the upstream command's envelope, so you can chain steps without copying URLs by hand.

| Reference          | Resolves to                                                     |
| ------------------ | --------------------------------------------------------------- |
| `-`                | Upstream's natural value for this field (scalar or array)       |
| `@N`               | The N-th output's primary value (e.g. `@0` = first output url)  |
| `@N.<jsonpath>`    | Drill into the N-th output (`@0.url`, `@1.meta.fps`)            |
| `@*`               | All outputs' primary values as an array                         |
| `@stdin`           | The whole upstream JSON envelope                                |
| `@stdin:<jsonpath>` | Jsonpath into the whole envelope (`@stdin:result.outputs[0].url`) |

### Examples

```bash
# Generate an image and feed its url straight into image-to-video
dlazy seedream-4.5 --prompt "a red fox in snow" \
  | dlazy kling-v3 --image - --prompt "fox starts running"

# Generate an image, then add TTS narration over a still
dlazy seedream-4.5 --prompt "lighthouse at dawn" \
  | dlazy keling-tts --text "Welcome to the coast." --image @0.url

# Fan-out: pass every upstream output url into a batch step
dlazy seedream-4.5 --prompt "city skyline" --n 4 \
  | dlazy superres --images @*
```

> Required flags can be entirely sourced from the pipe — `--field -` satisfies the requirement when an upstream value exists. If stdin is empty, the CLI fails with `code: "no_stdin"`.

## Usage

This is a comprehensive skill that routes generation requests to the appropriate `dlazy` model based on the user's intent.

### Available Models by Category

**Image Generation:**

- `dlazy gpt-image-2`: GPT Image 2 model for text-to-image and image editing. Supports generating images from text as well as editing and synthesizing images with reference inputs.
- `dlazy seedream-4.5`: High-quality text-to-image/image-to-image model, suitable for posters, realism, and creative scenes. Supports prompt + multiple reference images, outputting single high-res images (2K/4K).
- `dlazy seedream-5.0-lite`: Lightweight high-speed image generation model, suitable for batch generation, sketches, and low-cost iteration. Supports prompt + reference images, outputting 2K/3K images.
- `dlazy banana2`: General text-to-image model (optional 1 reference image), emphasizes speed and cost-effectiveness. Suitable for quick visual drafts, social media posts, and multi-size generation.
- `dlazy banana-pro`: High-quality text-to-image model (optional 1 reference image), suitable for key visuals, product shots, and brand style generation with higher detail requirements.
- `dlazy grok-4.2`: Minimalist text-to-image model, requires only prompt. Suitable for quick creative validation or scenarios with average quality requirements.
- `dlazy recraft-v3`: Stylized text-to-image model, supports aspect ratio and style control (realism/illustration, etc.). Suitable for brand KV, posters, and consistent visual content.
- `dlazy recraft-v3-svg`: Text-to-vector model, outputs SVG/vector-style results. Suitable for logos, icons, line art, and scalable design assets.
- `dlazy recraft-v4`: 1MP raster image generation with refined design judgment. Suitable for everyday creative work and fast iteration.
- `dlazy recraft-v4-vector`: Text-to-vector model that outputs SVG results. Suitable for logos, icons, and scalable design assets.
- `dlazy recraft-v4-pro`: 4MP high-resolution raster image generation. Suitable for print-ready assets and large-scale use.
- `dlazy recraft-v4-pro-vector`: High-fidelity text-to-vector model with 4MP-tier quality. Suitable for production-grade SVG assets and detailed illustrations.
- `dlazy mj-imagine`: Midjourney style generation, supports aspect ratio, Bot type, and output position (grid/U1-U4). Suitable for artistic and strongly stylized creative generation.
- `dlazy kling-image-o1`: Kling image model, supports '<image_1>' placeholder in prompt for reference image binding. Suitable for multi-image constraints and high-fidelity generation.
- `dlazy viduq2-t2i`: Vidu image generation model, supports text + reference image, aspect ratio, and resolution control. Suitable for character art, cover images, and high-res generation.
- `dlazy jimeng-t2i`: Jimeng high-res text-to-image model, supports multi-ratio ultra-clear output and reference image constraints, suitable for commercial visuals and refined generation.
- `dlazy imageseg`: Image matting tool: separates foreground from background and returns transparent background URL, suitable for product image processing, character cutout, and composition.
- `dlazy image-replicate`: Image replicate tool: analyzes the visuals, composition, colors, lighting, and style of the source image, builds a replicate prompt, and hands it off to Seedream 4.5 to generate a new image in the same style.
- `dlazy superres`: Image super-resolution tool: enhances image clarity and details, returning enhanced URL, suitable for low-res asset restoration and upscaling.

**Video Generation:**

- `dlazy seedance-2.0`: ByteDance's latest video generation model. Supports multi-modal reference (images, video, audio) to generate videos, as well as first/last frame and text-to-video modes.
- `dlazy seedance-2.0-fast`: Fast version of ByteDance's Seedance 2.0. Generates videos faster with support for multi-modal references, first/last frame, and text-to-video.
- `dlazy veo-3.1`: High-quality video generation model, supports text-to-video and single-image-driven video. Suitable for ad shorts and cinematic sequences (slower speed, higher quality).
- `dlazy happyhorse-1.0`: Happy Horse 1.0 video model — one model covers text-to-video (t2v), first-frame-to-video (i2v), reference-to-video (r2v), and video editing (edit). The selected mode is automatically routed to the matching sub-model.
- `dlazy veo-3.1-fast`: Fast video generation model, supports text-to-video and single/multi-image/first-last frame driven. Suitable for time-sensitive previews and rapid iterations.
- `dlazy kling-v3-omni`: Kling Omni video model, supports multiple reference images, duration, mode (std/pro), and optional audio. Suitable for highly controlled video synthesis tasks.
- `dlazy kling-v3`: Kling V3 general video model, supports text + up to 4 reference images, suitable for stable short video clips and daily creative workflows.
- `dlazy seedance-1.5-pro`: ByteDance high-quality video generation model, supports text-to-video with optional first/last frame control for transitions, suitable for narrative shorts and continuous action scenes.
- `dlazy wan2.7`: Tongyi Wanxiang 2.7 video model — one model covers text-to-video, first/last-frame-to-video, and reference-to-video: uses text-to-video when no images are provided, first/last-frame-to-video when frames are provided, and reference-to-video when reference images are supplied.
- `dlazy wan2.6-r2v`: Tongyi Wanxiang video generation model (Standard), supports text + reference image, resolution, and shot type control, suitable for general short video production.
- `dlazy wan2.6-r2v-flash`: Tongyi Wanxiang video generation model (Flash), optimized for speed and throughput, supports optional audio output, suitable for batch generation and quick trials.
- `dlazy pixverse-c1`: PixVerse C1 video model (strong on action, VFX, and high-motion scenes) — one model covers text-to-video, image-to-video, first/last-frame-to-video, and reference-to-video: t2v when no images, i2v with first frame only, kf2v with first+last frames, r2v with reference images.
- `dlazy viduq2-i2v`: Vidu image-to-video model, supports reference image-driven video, duration/resolution/ratio, and audio settings, suitable for image animation and short clips.
- `dlazy jimeng-i2v-first`: Jimeng first-frame-to-video model, uses first frame + text to generate video. Suitable for single-shot scenes that naturally animate static images.
- `dlazy jimeng-i2v-first-tail`: Jimeng first/last-frame video model, supports first and last frame constraints to control shot start/end states, suitable for transitions and clear action conclusions.
- `dlazy jimeng-dream-actor`: Jimeng character/action-driven video model, supports reference image and video input, suitable for character acting, action transfer, and style-consistent generation.
- `dlazy jimeng-omnihuman-1.5`: Jimeng digital human model, supports generating high-quality digital human videos from any aspect ratio image containing a character/subject combined with audio.
- `dlazy video-scenes`: Scene split tool: uses ffmpeg to detect and split a video into scene clips, returning only the clip URLs without video content understanding.
- `dlazy video-replicate`: Video replicate tool: extracts the first frame and audio from the source video, runs video understanding for a prompt, and returns a Seedance 2.0 replicate bundle (first frame + audio + video).
- `dlazy merge`: Audio/video merging tool: merges multiple video and audio tracks based on clips and timeline config, suitable for final cuts, scoring, and post-production.
- `dlazy one-click-generation`: Short-video generation pipeline. Configure subject, script, TTS voiceover, BGM, and subtitle styling.

**Audio Generation:**

- `dlazy gemini-2.5-tts`: Gemini-powered high-quality text-to-speech. Supports bilingual (EN/CN) and various emotional voices.
- `dlazy suno-music`: Suno music generation model. Supports inspiration mode (auto lyrics) and custom mode (manual lyrics), generating music with or without vocals.
- `dlazy keling-sfx`: Sound effect generation model: supports text-to-SFX and matching SFX/BGM for reference videos. Suitable for foley, ambient sounds, and short video audio completion.
- `dlazy keling-tts`: Text-to-speech model (TTS), supports language, voice, speed, and output format settings. Suitable for dubbing, audiobooks, and voice broadcasts.
- `dlazy doubao-tts`: ByteDance Doubao speech synthesis model. Supports multiple languages, voices, and highly natural streaming audio output, suitable for news broadcasts and audiobooks.
- `dlazy vidu-audio-clone`: Clone a real human voice and use it to read the specified text.
- `dlazy kling-audio-clone`: Custom voice (Kling), cloned voice used for dubbing or binding to subjects.

**CRITICAL INSTRUCTION FOR AGENT**:

1. Determine the media type (image, video, or audio) requested by the user.
2. Select the most appropriate model from the list above.
3. Run `dlazy <model_name> -h` to check the required parameters for that specific model.
4. Execute the command (e.g., `dlazy seedream-4.5 --prompt "..."`).


## Error Handling

| Code | Error Type                         | Example Message                                                                                                          |
| ---- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 401  | Unauthorized (No API Key)          | `ok: false, code: "unauthorized", message: "API key is missing or invalid"`                                                              |
| 501  | Missing required parameter         | `error: required option '--prompt <prompt>' not specified`                                                              |
| 502  | Local file read error              | `Error: Image file/Video file not found: C:\path\to\your\file`                                                          |
| 503  | API request failed (no balance)    | `ok: false, code: "insufficient_balance"` |
| 503  | API request failed (server error)  | `HTTP status code error (500 server crash)`                                                                             |
| 504  | Asynchronous task execution failed | `=== Generation Failed ===` / `{Specific error reason returned by backend, for example "Prompt violates safety policy"}` |

> **AGENT CRITICAL INSTRUCTION**: 
> 1. If the execution result returns `code: "insufficient_balance"`, you MUST explicitly inform the user that their credits are insufficient and guide them to recharge: [https://dlazy.com/dashboard/organization/settings?tab=credits](https://dlazy.com/dashboard/organization/settings?tab=credits)
> 2. If the execution result returns `code: "unauthorized"` or indicates missing API key, you MUST inform the user to get their API key from [https://dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key) and save it using `dlazy auth set <key>` and resume the task.

## Tips

Visit https://dlazy.com for more information.