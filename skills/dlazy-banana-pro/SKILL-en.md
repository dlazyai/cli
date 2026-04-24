---
name: dlazy-banana-pro
version: 1.0.3
description: Generate/edit images with Nano Banana Pro. Supports text-to-image and image-to-image.
metadata:
  {
    'clawdbot': { 'emoji': '🤖', 'requires': { 'bins': ['npm', 'npx'] }, "install":"npm install -g @dlazy/cli@1.0.6" },
    'openclaw': { 'systemPrompt': 'When this skill is called, you can run dlazy banana-pro -h to view help information.' },
  }
---

# dlazy-banana-pro

Generate/edit images with Nano Banana Pro. Supports text-to-image and image-to-image.

## Trigger Keywords

- nano banana pro, nano banana
- generate image, edit image
- text to image, image to image

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
Run the `dlazy banana-pro` command to get results.

```bash
dlazy banana-pro -h

Options :
  --prompt <prompt>           Prompt
  --aspectRatio <aspectRatio> Aspect Ratio (Supports: auto, 1:1, 4:3, 3:4, 16:9, 9:16, 21:9) [Default: auto]
  --imageSize <imageSize>     Image Size (Supports: 1K, 2K, 4K) [Default: 1K]
  --image <image>             Path to the local image file or remote image URL
  -h, --help                  display help for command
```

## Output Format

```json
{
  "ok": true,
  "kind": "urls",
  "data": {
    "urls": ["https://oss.dlazy.com/result.png"]
  }
}
```

## Command Examples

```bash
# text to image:
dlazy banana-pro --prompt 'prompt text' --image '/path/to/image.png'

# image to image:
dlazy banana-pro --prompt 'prompt text' --image 'https://oss.dlazy.com/image.png'

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