---
name: dlazy-veo-3.1
version: 1.0.2
description: Generate high-quality cinematic effects videos with Google Veo 3.1.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.6"},"openclaw":{"systemPrompt":"When this skill is called, you can run dlazy veo-3.1 -h to view help information."}}
---

# dlazy-veo-3.1

Generate high-quality cinematic effects videos with Google Veo 3.1.

## Trigger Keywords

- veo 3.1
- generate video
- text to video, image to video

## Authentication

All requests require the dLazy API key via CLI configuration.

**CLI Configuration**: You can set your API key using the following command:

```bash
dlazy auth set YOUR_API_KEY
```

### Getting Your API Key

1. Sign in or create an account at [dlazy.com](https://dlazy.com)
2. Go to [dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key)
3. Click the copy button on the right side of API Key section to copy it

## Usage

**CRITICAL INSTRUCTION FOR AGENT**: 
Run the `dlazy veo-3.1` command to get results.

```bash
dlazy veo-3.1 -h

Options:
  --prompt <prompt>                    Prompt
  --images <images...>                 Images [image: url or local path] (max 3) [default: ] [only when generation_mode="components"]
  --generation_mode <generation_mode>  Generation Mode [default: frames] (choices: "frames", "components")
  --firstFrame <firstFrame>            First Frame [image: url or local path] [only when generation_mode="frames"]
  --lastFrame <lastFrame>              Last Frame [image: url or local path] [only when generation_mode="frames"]
  --size <size>                        Size [default: 16:9] (choices: "16:9", "9:16")
  --resolution <resolution>            Resolution [default: 720P] (choices: "720P", "1080P", "4K")
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
dlazy veo-3.1 --prompt 'prompt text' --image '/path/to/image.png'

# complex call:
dlazy veo-3.1 --prompt 'prompt text' --image 'https://oss.dlazy.com/image.png'
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