---
name: dlazy-audio-generate
version: 1.1.1
description: Audio generation skill. Automatically selects the best dlazy CLI audio/TTS model based on the prompt. 音频生成技能。根据提示词自动选择最佳的 dlazy CLI 音频/TTS 模型。
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.9","installAlternative":"npx @dlazy/cli@1.0.9","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","files.dlazy.com"]},"openclaw":{"systemPrompt":"When this skill is called, use dlazy <subcommand>."}}
---

# dlazy-audio-generate

[English](./SKILL.md) · [中文](./SKILL-cn.md)


Audio generation skill. Automatically selects the best dlazy CLI audio/TTS model based on the prompt. 音频生成技能。根据提示词自动选择最佳的 dlazy CLI 音频/TTS 模型。

## Trigger Keywords / 触发关键词

- generate audio
- text to speech, TTS
- generate music, sound effect

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

This skill handles all audio generation requests by selecting the best `dlazy` audio model.

### Available Audio Models

- `dlazy gemini-2.5-tts`: Gemini-powered high-quality text-to-speech. Supports bilingual (EN/CN) and various emotional voices.
- `dlazy suno-music`: Suno music generation model. Supports inspiration mode (auto lyrics) and custom mode (manual lyrics), generating music with or without vocals.
- `dlazy keling-sfx`: Sound effect generation model: supports text-to-SFX and matching SFX/BGM for reference videos. Suitable for foley, ambient sounds, and short video audio completion.
- `dlazy keling-tts`: Text-to-speech model (TTS), supports language, voice, speed, and output format settings. Suitable for dubbing, audiobooks, and voice broadcasts.
- `dlazy doubao-tts`: ByteDance Doubao speech synthesis model. Supports multiple languages, voices, and highly natural streaming audio output, suitable for news broadcasts and audiobooks.
- `dlazy vidu-audio-clone`: Clone a real human voice and use it to read the specified text.
- `dlazy kling-audio-clone`: Custom voice (Kling), cloned voice used for dubbing or binding to subjects.

**CRITICAL INSTRUCTION FOR AGENT**:

1. Select the most appropriate audio model.
2. Run `dlazy <model_name> -h` to check parameters.
3. Execute the command.


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