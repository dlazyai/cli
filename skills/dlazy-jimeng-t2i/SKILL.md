---
name: dlazy-jimeng-t2i
version: 1.0.0
description: Text-to-image generation with Jimeng, quickly converting text to high-quality images.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When this skill is called, you can run dlazy jimeng-t2i -h to view help information."}}
---

# dlazy-jimeng-t2i

Text-to-image generation with Jimeng, quickly converting text to high-quality images.

## Trigger Keywords

- jimeng
- generate image, text to image
- draw a picture

## Usage

**CRITICAL INSTRUCTION FOR AGENT**: 
Run the `dlazy jimeng-t2i` command to get results.

```bash
dlazy jimeng-t2i -h

Options:
  --prompt <prompt>                    Prompt
  --images <images...>                 Images [image: url or local path] (max 10)
  --size <size>                        Size [default: 1440*2560] (choices: "1024*1024", "2048*2048", "2304*1728", "2496*1664", "2560*1440", "3024*1296", "1728*2304", "1664*2496", "1440*2560", "1296*3024", "4096*4096", "4694*3520", "4992*3328", "5404*3040", "6198*2656", "3520*4694", "3328*4992", "3040*5404", "2656*6198")
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
dlazy jimeng-t2i --prompt 'prompt text' --image '/path/to/image.png'

# complex call:
dlazy jimeng-t2i --prompt 'prompt text' --image 'https://oss.dlazy.com/image.png'
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