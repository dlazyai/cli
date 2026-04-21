---
name: dlazy-video-scenes
version: 1.0.0
description: Video analysis tool  uses ffmpeg to detect and split scenes, then performs scene-level video understanding and returns clip URLs with structured analysis.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When invoking this skill, use dlazy video-analysis -h for help."}}
---

# dlazy-video-scenes

Scene split tool: uses ffmpeg to detect and split a video into scene clips, returning only the clip URLs without video content understanding.

## Trigger Keywords

- video-scenes

## Usage

**CRITICAL INSTRUCTION FOR AGENT**:
Execute `dlazy video-scenes` to get the result.

```bash
dlazy video-scenes -h

Options:
  --video <video>                      Video (URL) [video: url or local path]
  --durationSeconds <durationSeconds>  Duration (s)
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
  "kind": "text",
  "data": {
    "text": "..."
  }
}
```

## Examples

```bash
dlazy video-scenes --prompt 'prompt content'
```

## Error Handling

| Code | Error Type                         | Example Message                                                                                                          |
| ---- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 401  | Unauthorized (No API Key)          | `ok: false, code: "unauthorized", message: "API key is missing or invalid"`                                              |
| 501  | Missing required parameter         | `error: required option '--prompt <prompt>' not specified`                                                               |
| 502  | Local file read error              | `Error: Image file/Video file not found: C:\path\to\your\file`                                                           |
| 503  | API request failed (no balance)    | `ok: false, code: "insufficient_balance"`                                                                                |
| 503  | API request failed (server error)  | `HTTP status code error (500 server crash)`                                                                              |
| 504  | Asynchronous task execution failed | `=== Generation Failed ===` / `{Specific error reason returned by backend, for example "Prompt violates safety policy"}` |

> **AGENT CRITICAL INSTRUCTION**:
>
> 1. If the execution result returns `code: "insufficient_balance"`, you MUST explicitly inform the user that their credits are insufficient and guide them to recharge: [https://dlazy.com/dashboard/organization/settings?tab=credits](https://dlazy.com/dashboard/organization/settings?tab=credits)
> 2. If the execution result returns `code: "unauthorized"` or indicates missing API key, you MUST inform the user to get their API key from [https://dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key) and send it to you. Once they provide it, save it using `dlazy auth set <key>` and resume the task.

## Tips

Visit https://dlazy.com for more information.