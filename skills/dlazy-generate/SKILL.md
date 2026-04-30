---
name: dlazy-generate
version: 1.0.9
description: A comprehensive generation skill. Can generate images, videos, and audio by automatically selecting the appropriate dlazy CLI model.
metadata:
  {
    'clawdbot':
      {
        'emoji': '🤖',
        'requires': { 'bins': ['npm', 'npx'] },
        'install': 'npm install -g @dlazy/cli@1.0.9',
        'installAlternative': 'npx @dlazy/cli@1.0.9',
        'homepage': 'https://github.com/dlazyai/cli',
        'source': 'https://github.com/dlazyai/cli',
        'author': 'dlazyai',
        'license': 'see-repo',
        'npm': 'https://www.npmjs.com/package/@dlazy/cli',
        'configLocation': '~/.dlazy/config.json',
        'apiEndpoints': ['api.dlazy.com', 'files.dlazy.com'],
      },
    'openclaw': { 'systemPrompt': 'When this skill is called, use dlazy <subcommand>.' },
  }
---

# dlazy-generate

[English](./SKILL.md) · [中文](./SKILL-cn.md)

A comprehensive generation skill. Can generate images, videos, and audio by automatically selecting the appropriate dlazy CLI model.

## Trigger Keywords

- generate
- create image, video, audio
- multimodal generation

## Authentication

All requests require a dLazy API key, configured through the CLI:

```bash
dlazy auth set YOUR_API_KEY
```

The CLI saves the key in your user config directory (`~/.dlazy/config.json` on macOS/Linux, `%USERPROFILE%\.dlazy\config.json` on Windows), with file permissions restricted to your OS user account. You can also supply the key per-invocation via the `DLAZY_API_KEY` environment variable.

### Getting Your API Key

1. Sign in or create an account at [dlazy.com](https://dlazy.com)
2. Go to [dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key)
3. Copy the key shown in the API Key section

Each key is scoped to your dLazy organization and can be **rotated or revoked at any time** from the same dashboard.



## About & Provenance

- **CLI source code**: [github.com/dlazyai/cli](https://github.com/dlazyai/cli)
- **Maintainer**: dlazyai
- **npm package**: `@dlazy/cli` (pinned to `1.0.9` in this skill's install spec)
- **Homepage**: [dlazy.com](https://dlazy.com)

You can install on demand without persisting a global binary by running:

```bash
npx @dlazy/cli@1.0.9 <command>
```

Or, if you prefer a global install, the skill's `metadata.clawdbot.install` field declares the exact pinned version (`npm install -g @dlazy/cli@1.0.9`). Review the GitHub source before installing.

## How It Works

This skill is a thin client over the dLazy hosted API. When you invoke it:

- Prompts and parameters you provide are sent to the dLazy API endpoint (`api.dlazy.com`) for inference.
- Any local file paths you pass to image / video / audio fields are uploaded to dLazy's media storage (`files.dlazy.com`) so the model can read them — the same flow as any cloud-based generation API.
- Generated output URLs returned by the API are hosted on `files.dlazy.com`.

This is the standard SaaS pattern; the skill itself does not access network or filesystem resources beyond what the dLazy CLI already handles. See [dlazy.com](https://dlazy.com) for the full service terms.

## Usage

This is a comprehensive skill that routes generation requests to the appropriate `dlazy` model based on the user's intent.

### Available Models by Category

**Image Generation:**

- `dlazy seedream-4.5`: High-quality realism/posters.
- `dlazy seedream-5.0-lite`: Fast, low-cost sketches.
- `dlazy banana2`, `dlazy banana-pro`: General text-to-image.
- `dlazy grok-4.2`: Minimalist.
- `dlazy recraft-v3`: Stylized (illustration).
- `dlazy recraft-v3-svg`: SVG/vector.
- `dlazy mj.imagine`: Midjourney style.
- `dlazy kling-image-o1`, `dlazy viduq2-t2i`, `dlazy jimeng-t2i`: Other specific high-quality image models.

**Video Generation:**

- `dlazy veo-3.1`, `dlazy veo-3.1-fast`: High-quality cinematic sequences.
- `dlazy sora-2`, `dlazy sora-2-pro`: Narrative clips.
- `dlazy kling-v3`, `dlazy kling-v3-omni`: General short clips.
- `dlazy seedance-1.5-pro`: Narrative shorts with transitions.
- `dlazy wan2.6-r2v`, `dlazy wan2.6-r2v-flash`: General/fast video production.
- `dlazy viduq2-i2v`, `dlazy jimeng-i2v-first`, `dlazy jimeng-i2v-first-tail`, `dlazy jimeng-dream-actor`, `dlazy jimeng-omnihuman-1.5`: Image-to-video, digital human, action transfer.

**Audio Generation:**

- `dlazy gemini-2.5-tts`, `dlazy doubao-tts`, `dlazy keling-tts`: Text-to-speech.
- `dlazy suno.music`: Music generation.
- `dlazy keling-sfx`: Sound effects.

**CRITICAL INSTRUCTION FOR AGENT**:

1. Determine the media type (image, video, or audio) requested by the user.
2. Select the most appropriate model from the list above.
3. Run \`dlazy <model_name> -h\` to check the required parameters for that specific model.
4. Execute the command (e.g., \`dlazy seedream-4.5 --prompt "..."\`).

## Error Handling

| Code | Error Type                         | Example Message                                                                                                              |
| ---- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 401  | Unauthorized (No API Key)          | \`ok: false, code: "unauthorized", message: "API key is missing or invalid"\`                                                |
| 501  | Missing required parameter         | \`error: required option '--prompt <prompt>' not specified\`                                                                 |
| 502  | Local file read error              | \`Error: Image file/Video file not found: C:\\path\\to\\your\\file\`                                                         |
| 503  | API request failed (no balance)    | \`ok: false, code: "insufficient_balance"\`                                                                                  |
| 503  | API request failed (server error)  | \`HTTP status code error (500 server crash)\`                                                                                |
| 504  | Asynchronous task execution failed | \`=== Generation Failed ===\` / \`{Specific error reason returned by backend, for example "Prompt violates safety policy"}\` |

> **AGENT CRITICAL INSTRUCTION**:
>
> 1. If the execution result returns \`code: "insufficient_balance"\`, you MUST explicitly inform the user that their credits are insufficient and guide them to recharge: [https://dlazy.com/dashboard/organization/settings?tab=credits](https://dlazy.com/dashboard/organization/settings?tab=credits)
> 2. If the execution result returns \`code: "unauthorized"\` or indicates missing API key, you MUST inform the user to get their API key from [https://dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key) and save it using \`dlazy auth set <key>\` and resume the task.

## Tips

Visit https://dlazy.com for more information.
