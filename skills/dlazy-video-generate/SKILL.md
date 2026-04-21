---
name: dlazy-video-generate
version: 1.0.0
description: Video generation skill. Automatically selects the best dlazy CLI video model based on the prompt.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When this skill is called, use dlazy <subcommand>."}}
---

# dlazy-video-generate

Video generation skill. Automatically selects the best dlazy CLI video model based on the prompt.

## Trigger Keywords

- generate video
- text to video
- animate image

## Usage

This skill handles all video generation requests by selecting the best `dlazy` video model.

### Available Video Models
- `dlazy veo-3.1`, `dlazy veo-3.1-fast`: High-quality cinematic sequences.
- `dlazy sora-2`, `dlazy sora-2-pro`: Narrative clips.
- `dlazy kling-v3`, `dlazy kling-v3-omni`: General short clips.
- `dlazy seedance-1.5-pro`: Narrative shorts with transitions.
- `dlazy wan2.6-r2v`, `dlazy wan2.6-r2v-flash`: General/fast video production.
- `dlazy viduq2-i2v`, `dlazy jimeng-i2v-first`, `dlazy jimeng-i2v-first-tail`, `dlazy jimeng-dream-actor`, `dlazy jimeng-omnihuman-1.5`: Image-to-video, digital human, action transfer.

**CRITICAL INSTRUCTION FOR AGENT**: 
1. Select the most appropriate video model.
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