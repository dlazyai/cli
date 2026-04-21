---
name: dlazy-seedream-5.0-lite
version: 1.0.0
description: Fast image generation with Doubao Seedream 5.0 Lite. Supports text-to-image and image-to-image.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When this skill is called, you can run dlazy seedream-5.0-lite -h to view help information."}}
---

# dlazy-seedream-5.0-lite

Fast image generation with Doubao Seedream 5.0 Lite. Supports text-to-image and image-to-image.

## Trigger Keywords

- doubao
- seedream
- generate image, fast image generation
- text to image, image to image

## Usage

**CRITICAL INSTRUCTION FOR AGENT**: 
Run the `dlazy seedream-5.0-lite` command to get results.

```bash
dlazy seedream-5.0-lite -h

Options:
  --prompt <prompt>                    Prompt
  --images <images...>                 Images [image: url or local path] (max 10) [default: ]
  --resolution <resolution>            Resolution [default: 2k] (choices: "2k", "3k")
  --size <size>                        Size [default: 16:9] (choices: "1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9")
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
dlazy seedream-5.0-lite --prompt 'prompt text' --image '/path/to/image.png'

# complex call:
dlazy seedream-5.0-lite --prompt 'prompt text' --image 'https://oss.dlazy.com/image.png'
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