---
name: video-storyboard-generate
version: 1.0.0
description: Convert the contents of a storyboard into a video-generation pipeline that the user can add to the canvas.
triggers:
  - Storyboard Video Generation Pipeline
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.8","installAlternative":"npx @dlazy/cli@1.0.8","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","oss.dlazy.com"]},"openclaw":{"systemPrompt":"When you need to use this skill, please strictly follow the guidelines provided by this skill to plan and execute. You can call various generative models of the dlazy CLI (such as dlazy seedream-4.5, etc.) to complete the actual image rendering. Note: Using `&` or `&&` for command chaining or background execution is not allowed in Windows PowerShell, please execute commands separately and synchronously."}}
---

## Authentication

All requests require a dLazy API key. The recommended way to obtain and store one is the browser-based device login flow:

```bash
dlazy login
```

This opens dlazy.com in your browser for approval and persists the key for you. If you already have a key on hand, configure it directly:

```bash
dlazy auth set YOUR_API_KEY
```

The CLI saves the key to `~/.dlazy/config.json` (`%USERPROFILE%\.dlazy\config.json` on Windows). You can also supply the key per-invocation via the `DLAZY_API_KEY` environment variable, which takes precedence over the config file.

### Getting Your API Key

1. Sign in or create an account at [dlazy.com](https://dlazy.com)
2. Go to [dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key)
3. Copy the key shown in the API Key section

Each key is scoped to your dLazy organization and can be **rotated or revoked at any time** from the same dashboard.

## About & Provenance

- **CLI source code**: [github.com/dlazyai/cli](https://github.com/dlazyai/cli)
- **Maintainer**: dlazyai
- **npm package**: `@dlazy/cli` (pinned to `1.0.8` in this skill's install spec)
- **Homepage**: [dlazy.com](https://dlazy.com)

You can install on demand without persisting a global binary by running:

```bash
npx @dlazy/cli@1.0.8 <command>
```

Or, if you prefer a global install, the skill's `metadata.clawdbot.install` field declares the exact pinned version (`npm install -g @dlazy/cli@1.0.8`). Review the GitHub source before installing.

## How It Works

This skill is a thin client over the dLazy hosted API. When you invoke it:

- Prompts and parameters you provide are sent to the dLazy API endpoint (`api.dlazy.com`) for inference.
- Any local file paths you pass to image / video / audio fields are uploaded to dLazy's media storage (`oss.dlazy.com`) so the model can read them — the same flow as any cloud-based generation API.
- Generated output URLs returned by the API are hosted on `oss.dlazy.com`.

This is the standard SaaS pattern; the skill itself does not access network or filesystem resources beyond what the dLazy CLI already handles.

# Storyboard Video Generation Pipeline

[English](./SKILL.md) · [中文](./SKILL-cn.md)

1. Get the storyboard info
2. Define the video generation pipeline
3. Draw it onto the canvas

## Get the Storyboard Info

Read the storyboard info from context:

- Image / video aspect ratio: aspect_ratio, e.g., 16:9, 9:16, 4:3, 3:4, 1:1
- Image / video resolution: resolution, e.g., 1080p, 720p
- Use the ratio and resolution to compute the video width and height (width, height)

Extract the storyboard list:

- Storyboard name: story_name1
- Dialogue text: dialogue_text1
- Video generation prompt: video_prompt1

## Define the Video Generation Pipeline

The pipeline is a JSON string. Sample format below — note these requirements:
1. Replace the contents inside `{name}`. Note that x / y / w / h are numbers — drop the quotes after substitution.
2. The original audio and the scene image are shared across all storyboards (one each). The cloned audio and the video are produced per storyboard, so iterate over the storyboard list.
3. Element x and y positions accumulate in the order of the storyboard list, with a 100-pixel gap between adjacent storyboards.

```json
[
  {
    "type": "audio",
    "x": 0,
    "y": 0,
    "props": {
      "name": "原始声音",
      "w": "{width}",
      "h": "{height}"
    }
  },
  {
    "type": "audio",
    "x": "{width + 100}",
    "y": 0,
    "props": {
      "name": "{story_name1} 克隆声音",
      "w": "{width}",
      "h": "{height}",
      "model": "vidu-audio-clone",
      "input": {
        "prompt": "{dialogue_text1}",
        "audio_url": "shape://name:原始声音"
      }
    }
  },
  {
    "type": "image",
    "x": 0,
    "y": "{height + 100}",
    "props": {
      "name": "场景图",
      "w": "{width}",
      "h": "{height}"
    }
  },
  {
    "type": "video",
    "x": "{width + 100}",
    "y": "{height + 100}",
    "props": {
      "name": "{story_name1} 视频",
      "w": "{width}",
      "h": "{height}",
      "model": "jimeng-omnihuman-1_5",
      "input": {
        "audio": ["shape://name:{story_name1} 克隆声音"],
        "images": ["shape://name:场景图"],
        "prompt": "{video_prompt1}",
        "fast_mode": false,
        "resolution": "{resolution}"
      }
    }
  }
]
```

> Note: The `name` strings (`原始声音`, `场景图`, `克隆声音`, `视频`) are runtime reference keys consumed by `shape://name:...` lookups on the canvas; keep them in Chinese as-is so the references resolve correctly.

## Draw onto the Canvas

Call the MCP `drawToCanvas` tool to add the pipeline defined above to the canvas.
