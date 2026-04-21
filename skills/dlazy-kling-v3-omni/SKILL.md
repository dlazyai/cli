---
name: dlazy-kling-v3-omni
version: 1.0.0
description: Versatile video generation with Kling v3 Omni. Supports multi-modal inputs to generate stunning dynamic videos.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When this skill is called, you can run dlazy kling-v3-omni -h to view help information."}}
---

# dlazy-kling-v3-omni

Versatile video generation with Kling v3 Omni. Supports multi-modal inputs to generate stunning dynamic videos.

## Trigger Keywords

- kling v3 omni
- generate omni video
- text to video, image to video

## Usage

**CRITICAL INSTRUCTION FOR AGENT**: 
Run the `dlazy kling-v3-omni` command to get results.

```bash
dlazy kling-v3-omni -h

Options:
  --prompt <prompt>                    Prompt
  --generation_mode <generation_mode>  Generation Mode [default: frames] (choices: "frames", "components")
  --images <images...>                 Images [image: url or local path] (max 7) [default: ]
  --subjects <subjects...>             Subjects (max 3) [hidden when generation_mode="frames"]
  --videos <videos...>                 Videos [video: url or local path] (max 1) [default: ] [hidden when generation_mode="frames"]
  --video_refer_type <video_refer_type>Video Refer Type [default: feature] (choices: "feature", "base") [only when videos non-empty]
  --keep_original_sound <keep_original_sound>Keep Original Sound [default: false] [only when videos non-empty]
  --aspect_ratio <aspect_ratio>        Aspect Ratio [default: 16:9] (choices: "16:9", "9:16", "1:1") [hidden when {"all":[{"field":"videos","operator":"notEmpty"},{"field":"video_refer_type","operator":"equals","value":"base"}]}]
  --duration <duration>                Duration (s) [default: 5] (choices: "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15") [hidden when {"all":[{"field":"videos","operator":"notEmpty"},{"field":"video_refer_type","operator":"equals","value":"base"}]}]
  --mode <mode>                        Mode [default: std] (choices: "std", "pro")
  --sound <sound>                      Sound Effect [default: false]
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

## Command Examples

```bash
# basic call:
dlazy kling-v3-omni --prompt 'prompt text' --image '/path/to/image.png'

# complex call:
dlazy kling-v3-omni --prompt 'prompt text' --image 'https://oss.dlazy.com/image.png'
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