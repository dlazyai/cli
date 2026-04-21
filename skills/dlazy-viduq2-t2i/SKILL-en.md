---
name: dlazy-viduq2-t2i
version: 1.0.0
description: Generate high-quality images with Vidu Q2. Supports text-to-image and image-to-image.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When this skill is called, you can run dlazy viduq2-t2i -h to view help information."}}
---

# dlazy-viduq2-t2i

Generate high-quality images with Vidu Q2. Supports text-to-image and image-to-image.

## Trigger Keywords

- vidu q2
- generate image, edit image
- text to image, image to image

## Usage

**CRITICAL INSTRUCTION FOR AGENT**: 
Run the `dlazy viduq2-t2i` command to get results.

```bash
dlazy viduq2-t2i -h

Options:
  --prompt <prompt>                    Prompt
  --generation_mode <generation_mode>  Generation Mode [default: components] (choices: "components")
  --images <images...>                 Images [image: url or local path] (max 10)
  --aspectRatio <aspectRatio>          Aspect Ratio [default: 9:16] (choices: "16:9", "9:16", "1:1", "3:4", "4:3", "21:9", "2:3", "3:2")
  --resolution <resolution>            Resolution [default: 1080p] (choices: "1080p", "2K", "4K")
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
dlazy viduq2-t2i --prompt 'prompt text' --image '/path/to/image.png'

# complex call:
dlazy viduq2-t2i --prompt 'prompt text' --image 'https://oss.dlazy.com/image.png'
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