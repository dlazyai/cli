---
name: dlazy-seedance-2.0
version: 1.0.0
description: ByteDance's latest video generation model. Supports multi-modal reference (images, video, audio) to generate videos, as well as first/last frame and text-to-video modes.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When invoking this skill, use dlazy seedance-2.0 -h for help."}}
---

# dlazy-seedance-2.0

ByteDance's latest video generation model. Supports multi-modal reference (images, video, audio) to generate videos, as well as first/last frame and text-to-video modes.

## Trigger Keywords

- seedance-2.0

## Usage

**CRITICAL INSTRUCTION FOR AGENT**: 
Execute `dlazy seedance-2.0` to get the result.

```bash
dlazy seedance-2.0 -h

Options:
  --prompt <prompt>                    Prompt
  --generation_mode <generation_mode>  Generation Mode [default: components] (choices: "components", "frames")
  --images <images...>                 Images [image: url or local path] (max 9) [hidden when generation_mode="frames"]
  --videos <videos...>                 Videos [video: url or local path] (max 3) [hidden when generation_mode="frames"]
  --audios <audios...>                 Audios [audio: url or local path] (max 3) [hidden when generation_mode="frames"]
  --firstFrame <firstFrame>            First Frame [image: url or local path] [only when generation_mode="frames"]
  --lastFrame <lastFrame>              Last Frame [image: url or local path] [only when generation_mode="frames"]
  --resolution <resolution>            Resolution [default: 720p] (choices: "480p", "720p", "1080p")
  --ratio <ratio>                      Aspect Ratio [default: 16:9] (choices: "21:9", "16:9", "4:3", "1:1", "3:4", "9:16")
  --duration <duration>                Duration (s) [default: 5] (choices: "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15")
  --generate_audio <generate_audio>    Generate Audio [default: true]
  --input <spec>                       JSON payload: inline string, @file, or - (stdin)
  --dry-run                            Print payload + cost estimate without calling API
  --no-wait                            Return generateId immediately for async tasks
  --timeout <seconds>                  Max seconds to wait for async completion (default: "1800")
  -h, --help                           display help for command
```

## Output Format

```json
{
  "ok": true,
  "kind": "urls",
  "data": {
    "urls": [
      "https://oss.dlazy.com/result.mp4"
    ]
  }
}
```

## Examples

```bash
dlazy seedance-2.0 --prompt 'prompt content' 
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
> 2. If the execution result returns `code: "unauthorized"` or indicates missing API key, you MUST inform the user to get their API key from [https://dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key) and send it to you. Once they provide it, save it using `dlazy auth set <key>` and resume the task.

## Tips

Visit https://dlazy.com for more information.