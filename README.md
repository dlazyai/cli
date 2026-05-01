# @dlazy/cli

**English** · [中文](./README.zh-CN.md)

`@dlazy/cli` ships **two surfaces** that share a single tool runner:

- **CLI** (`dlazy`) — terminal command for shell pipelines.
- **SDK** (`@dlazy/cli`) — JavaScript / TypeScript module for programmatic use.

Both produce the same structured **ToolResult** envelope, so output from one can flow directly into the other.

> Visit **https://dlazy.com/docs** for more information.

---

## Install

```bash
# CLI (global)
npm install -g @dlazy/cli

# SDK (per-project)
npm install @dlazy/cli
# or: pnpm add @dlazy/cli   |   yarn add @dlazy/cli
```

## Authenticate

```bash
dlazy login                 # device-code flow; opens browser, saves key to ~/.dlazy/config.json
dlazy login --local         # use http://localhost:3000 for local server testing
dlazy auth set sk-xxxx      # set key directly
dlazy auth get              # show current key (masked)
dlazy auth get --show       # reveal full key
dlazy logout                # clear key from config
```

Resolution order at runtime: `--api-key` flag → `DLAZY_API_KEY` env → `~/.dlazy/config.json` → interactive login (TTY only).

In SDK code:

```ts
import { configure } from '@dlazy/cli'
configure({ apiKey: process.env.DLAZY_API_KEY })
```

If `apiKey` is omitted the SDK uses the same fallback chain as the CLI.

---

## CLI Quick Start

```bash
# Generate one image
dlazy gpt-image-2 --prompt "a cyberpunk cat in neon rain"

# Pipe two tools (auto-resolved)
dlazy gpt-image-2 --prompt "detective profile" \
  | dlazy veo-3.1 --image - --prompt "drone push-in, rainy night"

# List tools / inspect one
dlazy tools list
dlazy tools describe gpt-image-2

# Async tasks: submit and poll later
dlazy veo-3.1 --image hero.png --prompt "..." --no-wait     # returns generateId
dlazy status gen_abc123 --wait
```

### Global Flags

| Flag                  | Effect                                                             |
| --------------------- | ------------------------------------------------------------------ |
| `--api-key <key>`     | Override stored API key for this run                               |
| `--base-url <url>`    | Override server (default: `DLAZY_BASE_URL` or `https://dlazy.com`) |
| `--verbose`           | Debug logs to stderr                                               |
| `--output <mode>`     | stdout format — `json` (default) / `url` / `text`                  |
| `-l, --lang <locale>` | UI / help language: `en-US` or `zh-CN`                             |

Locale is also picked up from `DLAZY_LANG`, then `LC_ALL`, then `LANG`.

### Per-Run Flags (every tool command)

| Flag                   | Effect                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `--dry-run`            | Resolve refs and echo the payload without auth, upload, or any network call          |
| `--no-wait`            | For async tools: return `{ generateId, status }` immediately                         |
| `--timeout <seconds>`  | Polling deadline for async completion (default 1800)                                 |
| `--input <jsonOrFile>` | Inline JSON object or `@path/to/file.json`; merged under flag values (flags win)     |
| `--batch <n>`          | Run the tool N times in parallel and merge all outputs (image/video/audio/text/auto) |

### Output Modes (`--output`)

stderr always carries human-readable progress; stdout is the machine-readable channel.

| Mode             | stdout                                                             |
| ---------------- | ------------------------------------------------------------------ |
| `json` (default) | Full envelope `{ ok, result }` (or `{ ok: false, code, message }`) |
| `url`            | One URL per line (only media outputs)                              |
| `text`           | One text block per output (only text outputs)                      |

For ad-hoc projection, use the default `json` mode and `jq`:

```bash
URL=$(dlazy gpt-image-2 --prompt "logo" --output url)
curl -O "$URL"

# script outputs structured storyboard JSON; pick the markdown rendering with jq
dlazy script --prompt "6 cinematic shots about a stray cat" \
  | jq -r '.result.outputs[0].value.texts[0]' > script.md

# Default JSON + jq — pick fields directly from the envelope.
dlazy gpt-image-2 --prompt "..." | jq -r '.result.outputs[0].url'
dlazy veo-3.1 --image hero.png --prompt "..." \
  | jq 'if .ok then .result else .message end'
```

### Pipelines

CLI flags accept reference tokens that pull values from piped stdin. References are resolved before any network call, so you compose tools without writing JSON paths into shell variables.

| Token           | Meaning                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------- |
| `-`             | Auto-pick — first output's primary value (scalar field) or all primary values (array field) |
| `@<n>`          | n-th output's primary value (`@0` = first)                                                  |
| `@<n>.<path>`   | jsonpath into the n-th output (e.g. `@0.url`, `@1.meta.fps`, `@0.text`)                     |
| `@*`            | All outputs as an array of primary values                                                   |
| `@stdin`        | The entire piped envelope                                                                   |
| `@stdin:<path>` | jsonpath into the entire envelope (e.g. `@stdin:result.usage.creditsCost`)                  |

Examples:

```bash
# 1) Single image → video (auto-resolution)
dlazy gpt-image-2 --prompt "..." \
  | dlazy veo-3.1 --image - --prompt "drone shot"

# 2) Pick the 2nd image from a 4-up batch
dlazy gpt-image-2 --batch 4 --prompt "..." \
  | dlazy veo-3.1 --image @1.url --prompt "slow zoom"

# 3) Array field: upstream's URLs flatten in
dlazy gpt-image-2 --batch 4 --prompt "..." \
  | dlazy merge --videos -

# 4) Storyboard text from `script` drives the next prompt
dlazy script --prompt "6 cinematic shots about a stray cat" \
  | dlazy gpt-image-2 --prompt @stdin:result.outputs[0].value.storyboards[0].firstFramePrompt
```

References work for any flag — text prompts, urls, ids, anything. `--dry-run` shows the resolved input without calling the API.

### Local Files & Data URLs

Any media-typed flag accepts:

- `https://...` — passed through
- `data:image/png;base64,...` — uploaded to object storage, replaced with a public URL
- `./path/to/file.png` — uploaded to object storage, replaced with a public URL

```bash
dlazy gpt-image-2 --image ./hero.png --prompt "stylize as oil painting"
```

Files larger than 100 MB log a warning; files larger than 500 MB are rejected.

### Batch Generation

All generation tools (`image` / `video` / `audio` / `text` / `auto`) accept `--batch <n>`. The CLI runs the tool **N times in parallel** with the same input and merges every run's outputs into one envelope:

```bash
# 4 image variants in one call (parallel) — outputs[0..3]
dlazy gpt-image-2 --prompt "rainy-night cyberpunk cat" --batch 4

# Combine with pipe references — feed each variant into a single video
dlazy gpt-image-2 --prompt "..." --batch 4 \
  | dlazy veo-3.1 --image @0.url --prompt "push-in"
```

`usage.creditsCost` / `tokenIn` / `tokenOut` are summed across runs; `durationMs` reports parallel wallclock (max). With `--no-wait`, each sub-run's `task` is surfaced as a JSON output so downstream pipes can still read every `generateId`.

### Async Tasks

Long-running tools (most video models) return a `generateId` and the CLI polls until completion by default. Override:

```bash
dlazy veo-3.1 --image hero.png --no-wait              # return generateId immediately
dlazy status gen_abc123 --wait --tool veo-3.1         # block until done (typed by tool's outputSchema)
dlazy status gen_abc123                                # one-shot status check
```

`--timeout <seconds>` controls the polling deadline (default 30 min). Pass `--tool <cli_name>` on `status` to parse the result through that tool's outputSchema; without it, the result comes back as a raw JSON output.

### Tool Discovery

```bash
dlazy <tool> --help            # all flags + types + defaults + dependent options
dlazy tools list               # registry overview
dlazy tools describe <tool>    # full input / output JSON Schema
```

The CLI caches the manifest for 24 h under `~/.dlazy/manifest-<locale>.json` and refreshes it in the background, so `--help` stays fast offline.

---

## SDK Quick Start

The SDK exposes the same runner as the CLI. Calls are **lazy**: each invocation returns a `Handle` that runs only when awaited or passed to `run()`. Handles can be wired into other handles' inputs to form a DAG that the runner schedules and memoizes.

```ts
import { gpt_image_2, run, configure } from '@dlazy/cli'

configure({ apiKey: process.env.DLAZY_API_KEY })

// One-shot (Handle is a thenable, awaiting it triggers run)
const result = await gpt_image_2({ prompt: 'cyberpunk cat' })
console.log(result.outputs[0].url)
```

### Naming

Tool functions are flat (no `image.` / `video.` namespace). Import each tool directly by its identifier-safe alias (`-`/`.` → `_`):

```ts
import { gpt_image_2, veo_3_1, wan2_6_r2v, mj_imagine } from '@dlazy/cli'

gpt_image_2({ prompt: '...' })
wan2_6_r2v({ image: hero })
mj_imagine({ prompt: '...' })

// Or, when the cli_name is dynamic, use tool() with the raw name:
import { tool } from '@dlazy/cli'
tool('gpt-image-2', { prompt: '...' })
tool('wan2.6-r2v', { image: hero })
```

Tool names aren't validated at call time; validation happens lazily on `run()` so the manifest is only fetched when you actually execute.

### Building a DAG

Pass handles directly into other tools' inputs. The runner walks the graph topologically, resolves each handle's natural value (URL for media, text for text, …), and only calls `executeTool` once per handle.

```ts
import { gpt_image_2, kling_image_o1, veo_3_1, merge, run } from '@dlazy/cli'

const hero = gpt_image_2({ prompt: 'detective in neon rain' })

// scenes is a list — handles inside arrays auto-resolve to scalars (their url)
const shots = ['wide push-in', 'close-up', 'tracking left'].map((desc) => kling_image_o1({ prompt: desc, image: hero }))

const clips = shots.map((img) => veo_3_1({ image: img, duration: 4 }))

// merge.videos is an array slot — passing the array of handles flattens
// each handle's url into the slot. A single handle in an array slot uses
// its full primary-value array.
const final = merge({ videos: clips })

const result = await run(final)
console.log(result.outputs[0].url)
```

### Lazy vs Eager

`Handle` is a `PromiseLike`. Awaiting it (eager) is identical to calling `run(handle)`:

```ts
import { gpt_image_2, run } from '@dlazy/cli'

const handle = gpt_image_2({ prompt: '...' }) // synchronous, no API call
const result = await handle // ← API call happens here
// equivalent:
const result2 = await run(handle)
```

Inside a DAG you usually don't `await` intermediate handles — pass them by reference and let the runner schedule them in one pass. `await` early only when you need the intermediate result in your own code (e.g. for a conditional branch).

### Configure

`configure()` is process-wide and additive. Call it once at startup or pass per-call options to `run()`.

```ts
configure({
  apiKey: 'sk-...', // default: DLAZY_API_KEY env / ~/.dlazy
  baseUrl: 'https://dlazy.com', // default: DLAZY_BASE_URL env / dlazy.com
  organizationId: 'org_abc', // optional, defaults to your default org
  projectId: 'proj_xyz', // optional, scopes generations to a project
  noInteractive: true, // skip device-code login on missing key
})
```

### Run Options

```ts
import { run } from '@dlazy/cli'

const result = await run(handle, {
  wait: true, // default true; set false to return as soon as the task is queued
  timeoutMs: 30 * 60_000, // default 30 min
  batch: 1, // default 1; >1 fans the handle out N times in parallel and merges outputs
})

if (result.task) {
  console.log('queued:', result.task.generateId)
}
```

Per-handle batch (overrides `RunOptions.batch`): pass `batch` in the input.

```ts
import { gpt_image_2 } from '@dlazy/cli'

const fourImages = await gpt_image_2({ prompt: '...', batch: 4 })
console.log(fourImages.outputs.length) // 4
```

### Working with Outputs

`ToolResult.outputs` is always an array. Each output carries its own `type` and the fields specific to that type. Use the typed unions if you need narrowing.

```ts
import type { Output, MediaOutput, TextOutput } from '@dlazy/cli'
import { primaryValue } from '@dlazy/cli'

function urlOf(o: Output): string | undefined {
  if (o.type === 'image' || o.type === 'video' || o.type === 'audio' || o.type === 'file') {
    return o.url
  }
  return undefined
}

import { gpt_image_2 } from '@dlazy/cli'

const result = await gpt_image_2({ prompt: '...' })
for (const o of result.outputs) {
  const v = primaryValue(o) // url | text | json value
  console.log(o.type, v)
}
```

Output shapes:

```ts
// image | video | audio | file
{ type, id, url, mimeType?, bytes?, width?, height?, durationMs?, fps?, thumbnailUrl?, meta? }

// text
{ type: "text", id, text, format?, meta? }

// json (any non-media payload, fallback)
{ type: "json", id, value, meta? }
```

### Error Handling

Errors throw `SdkError` with a stable `code` and `details` payload — same vocabulary the CLI uses for its `{ ok: false, code, message }` envelope.

```ts
import { veo_3_1, SdkError } from '@dlazy/cli'

try {
  await veo_3_1({ image: hero, prompt: '...' })
} catch (err) {
  if (err instanceof SdkError) {
    if (err.code === 'insufficient_balance') {
      // top up
    } else if (err.code === 'task_failed') {
      console.error('provider error:', err.details)
    }
  }
  throw err
}
```

Common codes: `unauthorized`, `forbidden`, `invalid_request`, `insufficient_balance`, `network_error`, `task_failed`, `timeout`, `tool_not_found`, `file_not_found`, `file_too_large`, `upload_failed`, `missing_field`, `bad_ref`, `no_stdin`, `no_api_key`.

### Inspect Tools at Runtime

```ts
import { describeTool, getManifest } from '@dlazy/cli'

const all = await getManifest()
console.log(all.tools.map((t) => t.cli_name))

const tool = await describeTool('gpt-image-2')
console.log(tool.inputJsonSchema)
console.log(tool.outputJsonSchema)
```

---

## ToolResult — Unified Output Contract

CLI and SDK both surface the same shape. CLI wraps it as `{ ok: true, result }` on stdout; SDK returns the inner `result` directly.

```ts
type ToolResult = {
  tool: string // cli_name, e.g. "seedream-4.5"
  modelId: string // server-side model id
  outputs: Output[] // always an array, never a scalar
  usage?: {
    creditsCost?: number
    durationMs?: number
    tokenIn?: number
    tokenOut?: number
  }
  task?: {
    // present when wait=false / async
    generateId: string
    status: 'pending' | 'running'
  }
}
```

Sample envelope (CLI default `--output json`):

```json
{
  "ok": true,
  "result": {
    "tool": "gpt-image-2",
    "modelId": "gpt-image-2",
    "outputs": [
      {
        "type": "image",
        "id": "o_8a1f3b7d",
        "url": "https://cdn.dlazy.com/...png",
        "mimeType": "image/png"
      }
    ]
  }
}
```

Failure envelope:

```json
{ "ok": false, "code": "insufficient_balance", "message": "...", "details": {} }
```

Exit codes: `0` on success, `1` for runtime / network failures, `2` for input / config errors (missing field, bad JSON, unknown tool, bad ref).

---

## Supported Tools

A snapshot — run `dlazy tools list` to see the live registry, or `dlazy tools describe <name>` for full input/output schemas.

| Command                                                                                      | Type          | Description                                                                                                     |
| -------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| `seedream-4.5`                                                                               | image         | Doubao Seedream 4.5 high-quality text-to-image / reference-to-image.                                            |
| `seedream-5.0-lite`                                                                          | image         | Doubao Seedream 5.0 fast image generation.                                                                      |
| `banana2` / `banana-pro`                                                                     | image         | Gemini Banana general / pro text-to-image.                                                                      |
| `gpt-image-2`                                                                                | image         | GPT Image 2 (text + reference image editing).                                                                   |
| `grok-4.2`                                                                                   | image         | Minimal text-to-image.                                                                                          |
| `recraft-v3` / `recraft-v3-svg` / `recraft-v4*`                                              | image         | Stylized / vector / pro variants.                                                                               |
| `kling-image-o1`                                                                             | image         | Kling image (multi-image constraints).                                                                          |
| `mj-imagine`                                                                                 | image         | Midjourney-style.                                                                                               |
| `viduq2-t2i` / `jimeng-t2i`                                                                  | image         | Vidu / Jimeng text-to-image.                                                                                    |
| `imageseg` / `superres`                                                                      | tool          | Background removal / upscale.                                                                                   |
| `veo-3.1` / `veo-3.1-fast`                                                                   | video         | Veo high-quality / fast text-to-video.                                                                          |
| `seedance-2.0` / `seedance-2.0-fast` / `seedance-1.5-pro`                                    | video         | ByteDance Seedance video.                                                                                       |
| `kling-v3` / `kling-v3-omni`                                                                 | video         | Kling V3 / omni-control video.                                                                                  |
| `wan2.6-r2v` / `wan2.6-r2v-flash` / `wan2.7`                                                 | video         | Tongyi Wanxiang video.                                                                                          |
| `pixverse-c1`                                                                                | video         | PixVerse C1 (action / VFX).                                                                                     |
| `viduq2-i2v`                                                                                 | video         | Vidu image-to-video.                                                                                            |
| `jimeng-i2v-first` / `jimeng-i2v-first-tail` / `jimeng-dream-actor` / `jimeng-omnihuman-1.5` | video         | Jimeng video family.                                                                                            |
| `video-replicate` / `image-replicate`                                                        | video / image | Replicate-bridged models.                                                                                       |
| `video-scenes` / `merge`                                                                     | video         | Scene split / multi-clip merge.                                                                                 |
| `gemini-2.5-tts`                                                                             | audio         | Gemini 2.5 Pro TTS.                                                                                             |
| `keling-tts` / `doubao-tts`                                                                  | audio         | Kling / Doubao speech synthesis.                                                                                |
| `keling-sfx`                                                                                 | audio         | Sound effects / foley.                                                                                          |
| `suno-music`                                                                                 | audio         | Suno music generation.                                                                                          |
| `vidu-audio-clone` / `kling-audio-clone`                                                     | audio         | Voice cloning.                                                                                                  |
| `plan` / `execute`                                                                           | text          | Workflow planning / execution.                                                                                  |
| `script`                                                                                     | text          | Storyboard generator: structured subjects + storyboards from a free-text brief, with optional reference images. |
| `one-click-generation`                                                                       | video         | One-click full pipeline.                                                                                        |

---

## Runtime Requirements

- Node.js ≥ 18 (built for `node18` target; `fetch` and async iterators are required).
- The CLI ships as a single CJS bundle; the SDK is also CJS but re-exported via `package.json#exports` for both `require` and ESM `import`.
