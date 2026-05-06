---
name: dlazy-one-click-generation
version: 1.1.1
description: Short-video generation pipeline. Configure subject, script, TTS voiceover, BGM, and subtitle styling.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.9","installAlternative":"npx @dlazy/cli@1.0.9","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","files.dlazy.com"]},"openclaw":{"systemPrompt":"When invoking this skill, use dlazy one-click-generation -h for help."}}
---

# dlazy-one-click-generation

[English](./SKILL.md) · [中文](./SKILL-cn.md)


Short-video generation pipeline. Configure subject, script, TTS voiceover, BGM, and subtitle styling.

## Trigger Keywords

- one-click-generation

## Authentication

All requests require a dLazy API key. The recommended way to authenticate is:

```bash
dlazy login
```

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

## Usage

**CRITICAL INSTRUCTION FOR AGENT**:
Execute `dlazy one-click-generation` to get the result.

```bash
dlazy one-click-generation -h

Options:
  --prompt [prompt]                    Prompt
  --manual_script_terms [manual_script_terms]Manual script & terms input [default: false]
  --video_script [video_script]        Video Script [only when manual_script_terms="true"]
  --video_terms [video_terms]          Video Terms [only when manual_script_terms="true"]
  --local_video_files [local_video_files]Local Video Files [only when video_source="local"]
  --video_concat_mode [video_concat_mode]Concat Mode [default: random] (choices: "random", "sequential")
  --video_transition_mode [video_transition_mode]Transition Mode [default: None] (choices: "None", "Shuffle", "FadeIn", "FadeOut", "SlideIn", "SlideOut")
  --video_aspect [video_aspect]        Video Aspect [default: 9:16] (choices: "9:16", "16:9", "1:1")
  --video_clip_duration [video_clip_duration]Max Clip Duration (2-10s) [default: 3] (choices: "2", "3", "4", "5", "6", "7", "8", "9", "10")
  --video_count [video_count]          Video Count (1-5) [default: 1] (choices: "1", "2", "3", "4", "5")
  --voice_region [voice_region]        Voice Region [default: zh-CN] (choices: "zh-CN", "zh-HK", "zh-TW")
  --voice_name [voice_name]            Voice Options depend on "voice_region". when voice_region="zh-CN": zh-CN-XiaoxiaoNeural (晓晓 - 女声 / Xiaoxiao - Female), zh-CN-XiaoyiNeural (晓伊 - 女声 / Xiaoyi - Female), zh-CN-YunjianNeural (云健 - 男声 / Yunjian - Male), zh-CN-YunxiNeural (云希 - 男声 / Yunxi - Male), zh-CN-YunxiaNeural (云夏 - 男童声 / Yunxia - Boy), zh-CN-YunyangNeural (云扬 - 男声 / Yunyang - Male), zh-CN-liaoning-XiaobeiNeural (晓贝 - 东北女声 / Xiaobei - Liaoning Female), zh-CN-shaanxi-XiaoniNeural (晓妮 - 陕西女声 / Xiaoni - Shaanxi Female); when voice_region="zh-HK": zh-HK-HiuGaaiNeural (曉佳 - 粤语女声 / HiuGaai - Cantonese Female), zh-HK-HiuMaanNeural (曉曼 - 粤语女声 / HiuMaan - Cantonese Female), zh-HK-WanLungNeural (雲龍 - 粤语男声 / WanLung - Cantonese Male); when voice_region="zh-TW": zh-TW-HsiaoChenNeural (曉臻 - 台湾女声 / HsiaoChen - Taiwanese Female), zh-TW-HsiaoYuNeural (曉雨 - 台湾女声 / HsiaoYu - Taiwanese Female), zh-TW-YunJheNeural (雲哲 - 台湾男声 / YunJhe - Taiwanese Male) [default: zh-CN-XiaoxiaoNeural] [options depend on --voice_region; voice_region=zh-CN: zh-CN-XiaoxiaoNeural (晓晓 - 女声 / Xiaoxiao - Female), zh-CN-XiaoyiNeural (晓伊 - 女声 / Xiaoyi - Female), zh-CN-YunjianNeural (云健 - 男声 / Yunjian - Male), zh-CN-YunxiNeural (云希 - 男声 / Yunxi - Male), zh-CN-YunxiaNeural (云夏 - 男童声 / Yunxia - Boy), zh-CN-YunyangNeural (云扬 - 男声 / Yunyang - Male), zh-CN-liaoning-XiaobeiNeural (晓贝 - 东北女声 / Xiaobei - Liaoning Female), zh-CN-shaanxi-XiaoniNeural (晓妮 - 陕西女声 / Xiaoni - Shaanxi Female); voice_region=zh-HK: zh-HK-HiuGaaiNeural (曉佳 - 粤语女声 / HiuGaai - Cantonese Female), zh-HK-HiuMaanNeural (曉曼 - 粤语女声 / HiuMaan - Cantonese Female), zh-HK-WanLungNeural (雲龍 - 粤语男声 / WanLung - Cantonese Male); voice_region=zh-TW: zh-TW-HsiaoChenNeural (曉臻 - 台湾女声 / HsiaoChen - Taiwanese Female), zh-TW-HsiaoYuNeural (曉雨 - 台湾女声 / HsiaoYu - Taiwanese Female), zh-TW-YunJheNeural (雲哲 - 台湾男声 / YunJhe - Taiwanese Male)]
  --voice_volume [voice_volume]        Voice Volume (1.0 = 100%) [default: 1.0] (choices: "0.5", "0.8", "1.0", "1.2", "1.5", "2.0")
  --voice_rate [voice_rate]            Voice Rate (1.0 = 1x) [default: 1.0] (choices: "0.5", "0.8", "1.0", "1.2", "1.5", "2.0")
  --bgm_type [bgm_type]                BGM [default: random] (choices: "random", "none")
  --bgm_volume [bgm_volume]            BGM Volume [default: 0.2] (choices: "0.0", "0.1", "0.2", "0.3", "0.4", "0.5", "0.8", "1.0")
  --subtitle_enabled [subtitle_enabled]Enable Subtitles [default: true]
  --font_name [font_name]              Subtitle Font [default: MicrosoftYaHeiBold.ttc] (choices: "MicrosoftYaHeiBold.ttc", "MicrosoftYaHei.ttc")
  --subtitle_position [subtitle_position]Subtitle Position [default: bottom] (choices: "bottom", "top", "center")
  --text_fore_color [text_fore_color]  Text Color [default: #FFFFFF]
  --stroke_color [stroke_color]        Stroke Color [default: #000000]
  --font_size [font_size]              Font Size [default: 60] (choices: "30", "40", "50", "60", "70", "80", "90", "100")
  --stroke_width [stroke_width]        Stroke Width [default: 1.5] (choices: "0.0", "0.5", "1.0", "1.5", "2.0", "3.0", "5.0", "10.0")
  --dry-run                            Print payload + cost estimate without calling API
  --no-wait                            Return generateId immediately for async tasks
  --timeout <seconds>                  Max seconds to wait for async completion (default: "1800")
  -h, --help                           display help for command
```

> Any flag also accepts pipe references — `-` (auto-pick from upstream stdin), `@N` (n-th output), `@N.path` (jsonpath into output), `@*` (all primary values), `@stdin` / `@stdin:path` (whole envelope). See `dlazy --help` for details.

## Output Format

```json
{
  "ok": true,
  "result": {
    "tool": "one-click-generation",
    "modelId": "one-click-generation",
    "outputs": [
      {
        "type": "image",
        "id": "o_xxxxxxxx",
        "url": "https://files.dlazy.com/result.png",
        "mimeType": "image/png"
      }
    ]
  }
}
```

> Async tasks (when `--no-wait` is passed) return `outputs: []` and a `task: { generateId, status }` field instead. Use `dlazy status <generateId> --wait` to poll.

## Examples

```bash
dlazy one-click-generation --prompt 'prompt content'
```

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