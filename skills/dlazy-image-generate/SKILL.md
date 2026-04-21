---
name: dlazy-image-generate
version: 1.0.0
description: Image generation skill. Automatically selects the best dlazy CLI image model based on the prompt.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When this skill is called, use dlazy <subcommand>."}}
---

# dlazy-image-generate

Image generation skill. Automatically selects the best dlazy CLI image model based on the prompt.

## Trigger Keywords

- generate image
- draw picture
- text to image

## Usage

This skill handles all image generation requests by selecting the best `dlazy` image model.

### Available Image Models
- `dlazy seedream-4.5`: High-quality realism/posters.
- `dlazy seedream-5.0-lite`: Fast, low-cost sketches.
- `dlazy banana2`, `dlazy banana-pro`: General text-to-image.
- `dlazy grok-4.2`: Minimalist.
- `dlazy recraft-v3`: Stylized (illustration).
- `dlazy recraft-v3-svg`: SVG/vector.
- `dlazy mj.imagine`: Midjourney style.
- `dlazy kling-image-o1`, `dlazy viduq2-t2i`, `dlazy jimeng-t2i`: High-fidelity generation.

**CRITICAL INSTRUCTION FOR AGENT**: 
1. Select the most appropriate image model.
2. Run \`dlazy <model_name> -h\` to check parameters.
3. Execute the command.

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