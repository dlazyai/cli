---
name: dlazy-keling-tts
version: 1.0.0
description: Convert text into high-quality, emotional speech reading using Kling TTS.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When this skill is called, you can run dlazy keling-tts -h to view help information."}}
---

# dlazy-keling-tts

Convert text into high-quality, emotional speech reading using Kling TTS.

## Trigger Keywords

- kling tts
- text to speech
- generate speech

## Usage

**CRITICAL INSTRUCTION FOR AGENT**: 
Run the `dlazy keling-tts` command to get results.

```bash
dlazy keling-tts -h

Options:
  --prompt <prompt>                    Prompt
  --voice_language <voice_language>    Voice Language [default: zh] (choices: "zh", "en")
  --voiceId <voiceId>                  Voice ID [default: genshin_vindi2]
  --speed <speed>                      Speed [default: 1.0] (choices: "0.8", "1.0", "1.5")
  --format <format>                    Format [default: mp3] (choices: "mp3", "wav")
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
dlazy keling-tts --prompt 'prompt text'

# complex call:
dlazy keling-tts --prompt 'prompt text'
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