# 🤖 dLazy AI Skills Collection

This repository contains a collection of powerful AI generation skills

Powered by the [@dlazy/cli](https://www.npmjs.com/package/@dlazy/cli), these skills allow your AI agent to automatically generate images, videos, and audio directly in your terminal.

## 📦 Prerequisites

Before using any of these skills, your AI agent needs the CLI tool installed:

```bash
npm install -g @dlazy/cli
dlazy login
```

## 🛠️ Composite Skills (Recommended)

The easiest way to get started is by using our composite skills. These skills allow the AI to automatically route your request to the best underlying model.

| Skill Name                                         | Description                                                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **[dlazy-generate](./dlazy-generate)**             | 🌟 **The Ultimate Generator**: Automatically routes to the best model for image, video, or audio based on user intent. |
| **[dlazy-image-generate](./dlazy-image-generate)** | Master of all Image models (Midjourney, Seedream, Kling, etc.)                                                         |
| **[dlazy-video-generate](./dlazy-video-generate)** | Master of all Video models (Sora, Veo, Kling V3, etc.)                                                                 |
| **[dlazy-audio-generate](./dlazy-audio-generate)** | Master of all Audio & TTS models (Gemini TTS, Suno, etc.)                                                              |

## 🎨 Individual Model Skills

If you want the AI to strictly use a specific model, you can install its individual skill:

**Image Models:**

- [dlazy-mj-imagine](./dlazy-mj-imagine) - Midjourney style generation
- [dlazy-seedream-4.5](./dlazy-seedream-4.5) - High quality realism
- [dlazy-seedream-5.0-lite](./dlazy-seedream-5.0-lite) - Fast & low-cost sketches
- [dlazy-kling-image-o1](./dlazy-kling-image-o1) - Kling O1 image generation
- [dlazy-recraft-v3](./dlazy-recraft-v3) - Stylized illustrations
- [dlazy-recraft-v3-svg](./dlazy-recraft-v3-svg) - SVG vector generation
- [dlazy-grok-4.2](./dlazy-grok-4.2) - Grok image generation
- [dlazy-banana2](./dlazy-banana2) - General text-to-image
- [dlazy-banana-pro](./dlazy-banana-pro) - General text-to-image (Pro)
- [dlazy-viduq2-t2i](./dlazy-viduq2-t2i) - Vidu Q2 image generation
- [dlazy-jimeng-t2i](./dlazy-jimeng-t2i) - Jimeng text-to-image

**Video Models:**

- [dlazy-sora-2](./dlazy-sora-2) - Sora 2 video generation
- [dlazy-sora-2-pro](./dlazy-sora-2-pro) - Sora 2 Pro narrative clips
- [dlazy-veo-3.1](./dlazy-veo-3.1) - Veo 3.1 high-quality sequences
- [dlazy-veo-3.1-fast](./dlazy-veo-3.1-fast) - Veo 3.1 fast video sequences
- [dlazy-kling-v3](./dlazy-kling-v3) - Kling V3 short clips
- [dlazy-kling-v3-omni](./dlazy-kling-v3-omni) - Kling V3 Omni generation
- [dlazy-wan2.6-r2v](./dlazy-wan2.6-r2v) - Wan 2.6 video production
- [dlazy-wan2.6-r2v-flash](./dlazy-wan2.6-r2v-flash) - Wan 2.6 fast video production
- [dlazy-seedance-1.5-pro](./dlazy-seedance-1.5-pro) - Narrative shorts with transitions
- [dlazy-viduq2-i2v](./dlazy-viduq2-i2v) - Vidu Q2 image-to-video
- [dlazy-jimeng-i2v-first](./dlazy-jimeng-i2v-first) - Jimeng image-to-video
- [dlazy-jimeng-i2v-first-tail](./dlazy-jimeng-i2v-first-tail) - Jimeng image-to-video (tail control)
- [dlazy-jimeng-dream-actor](./dlazy-jimeng-dream-actor) - Jimeng digital human
- [dlazy-jimeng-omnihuman-1.5](./dlazy-jimeng-omnihuman-1.5) - Jimeng omnihuman

**Audio Models:**

- [dlazy-suno-music](./dlazy-suno-music) - Suno music generation
- [dlazy-gemini-2.5-tts](./dlazy-gemini-2.5-tts) - Gemini 2.5 TTS
- [dlazy-doubao-tts](./dlazy-doubao-tts) - Doubao TTS
- [dlazy-keling-tts](./dlazy-keling-tts) - Keling TTS
- [dlazy-keling-sfx](./dlazy-keling-sfx) - Keling sound effects
- [dlazy-vidu-audio-clone](./dlazy-vidu-audio-clone) - Vidu voice cloning
- [dlazy-kling-audio-clone](./dlazy-kling-audio-clone) - Kling voice cloning

_(See the repository folders for the complete list of available models)_

## 🚀 How to Install & Use

### For Trae / Cursor

1. Download the `SKILL.md` (or `SKILL-cn.md`) file from the desired skill folder in this repository.
2. Place it in your project's `.trae/skills/<skill-name>/` folder (for Trae) or `.cursorrules` (for Cursor).
3. Tell your AI: _"Generate a video of a cat running using dlazy"_ and watch the magic happen!

## 🔗 Links

- [dLazy Dashboard](https://dlazy.com/zh-CN/dashboard)
- [NPM Package](https://www.npmjs.com/package/@dlazy/cli)
