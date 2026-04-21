---
name: dlazy-mj.imagine
version: 1.0.0
description: Generate artistic images using Midjourney (MJ) model. Supports text-to-image.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When this skill is called, you can run dlazy mj.imagine -h to view help information."}}
---

# dlazy-mj.imagine

Generate artistic images using Midjourney (MJ) model. Supports text-to-image.

## Trigger Keywords

- midjourney
- mj
- generate image, artistic painting
- text to image

## Usage

**CRITICAL INSTRUCTION FOR AGENT**: 
Run the `dlazy mj.imagine` command to get results.

```bash
dlazy mj.imagine -h

Options:
  --prompt <prompt>                    Prompt
  --aspect_ratio <aspect_ratio>        Aspect Ratio [default: auto] (choices: "auto", "1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9")
  --botType <botType>                  Bot Type [default: MID_JOURNEY] (choices: "MID_JOURNEY", "NIJI_JOURNEY")
  --output <output>                    Output [default: grid] (choices: "grid", "U1", "U2", "U3", "U4")
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
dlazy mj.imagine --prompt 'prompt text' --image '/path/to/image.png'

# complex call:
dlazy mj.imagine --prompt 'prompt text' --image 'https://oss.dlazy.com/image.png'
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