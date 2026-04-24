---
name: dlazy-image-replicate
version: 1.0.3
description: Image replicate tool: analyzes the visuals, composition, colors, lighting, and style of the source image, builds a replicate prompt, and hands it off to Seedream 4.5 to generate a new image in the same style.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.6"},"openclaw":{"systemPrompt":"When invoking this skill, use dlazy image-replicate -h for help."}}
---

# dlazy-image-replicate

Image replicate tool: analyzes the visuals, composition, colors, lighting, and style of the source image, builds a replicate prompt, and hands it off to Seedream 4.5 to generate a new image in the same style.

## Trigger Keywords

- image-replicate

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
Execute `dlazy image-replicate` to get the result.

```bash
dlazy image-replicate -h

Options:
  --images <images...>                 Images [image: url or local path]
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
dlazy image-replicate --prompt 'prompt content' 
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