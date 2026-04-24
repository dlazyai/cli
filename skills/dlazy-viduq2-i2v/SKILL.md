---
name: dlazy-viduq2-i2v
version: 1.0.2
description: Convert static images into dynamic videos using Vidu Q2 image-to-video model.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.6"},"openclaw":{"systemPrompt":"When this skill is called, you can run dlazy viduq2-i2v -h to view help information."}}
---

# dlazy-viduq2-i2v

Convert static images into dynamic videos using Vidu Q2 image-to-video model.

## Trigger Keywords

- vidu q2
- image to video
- image to dynamic video

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
Run the `dlazy viduq2-i2v` command to get results.

```bash
dlazy viduq2-i2v -h

Options:
  --prompt <prompt>                    Prompt
  --generation_mode <generation_mode>  Generation Mode [default: components] (choices: "components", "frames")
  --images <images...>                 Images [image: url or local path] (max 10) [hidden when generation_mode="frames"]
  --firstFrame <firstFrame>            First Frame [image: url or local path] [only when generation_mode="frames"]
  --lastFrame <lastFrame>              Last Frame [image: url or local path] [only when generation_mode="frames"]
  --subjects <subjects...>             Subjects (max 7) [hidden when generation_mode="frames"]
  --audio <audio>                      Audio [default: false] (choices: "true", "false")
  --audioType <audioType>              Audio Type [default: all] (choices: "all", "speech_only") [hidden when generation_mode="frames"]
  --duration <duration>                Duration (s) [default: 5] (choices: "2", "3", "4", "5", "6", "7", "8", "9", "10")
  --aspectRatio <aspectRatio>          Aspect Ratio [default: 9:16] (choices: "16:9", "9:16", "1:1", "3:4", "4:3", "21:9", "2:3", "3:2")
  --resolution <resolution>            Resolution [default: 720p] (choices: "540p", "720p", "1080p")
  --watermark <watermark>              Watermark [default: false] (choices: "true", "false")
  --wmPosition <wmPosition>            Watermark Position [default: 3] (choices: "1", "2", "3", "4")
  --wmUrl <wmUrl>                      Watermark URL
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
dlazy viduq2-i2v --prompt 'prompt text' --image '/path/to/image.png'

# complex call:
dlazy viduq2-i2v --prompt 'prompt text' --image 'https://oss.dlazy.com/image.png'
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