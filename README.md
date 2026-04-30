# @dlazy/cli

[English](#english) | [中文](#中文)

`@dlazy/cli` ships **two surfaces** that share a single tool runner:

- A command-line tool (`dlazy`) for terminal usage and shell pipelines.
- A JavaScript / TypeScript SDK (`@dlazy/cli/sdk`) for programmatic use.

Both produce the same structured **ToolResult** envelope, so output from one can flow into the other.

---

## English

**Visit https://dlazy.com for more information.**

### Install

```bash
# CLI (global)
npm install -g @dlazy/cli

# SDK (per-project)
npm install @dlazy/cli
# or: pnpm add @dlazy/cli   |   yarn add @dlazy/cli
```

### Authenticate

```bash
dlazy login                 # opens browser, saves key to ~/.dlazy/config.json
dlazy auth set sk-xxxx      # set key directly
dlazy auth get              # show current key
dlazy logout                # clear key
```

In SDK code:

```ts
import { configure } from "@dlazy/cli/sdk";
configure({ apiKey: process.env.DLAZY_API_KEY });
```

If `apiKey` is omitted the SDK falls back to `DLAZY_API_KEY` env / `~/.dlazy/config.json`, exactly like the CLI.

---

## CLI Quick Start

```bash
# Generate one image
dlazy seedream-4.5 --prompt "a cyberpunk cat in neon rain"

# Pipe two tools (auto-resolved)
dlazy seedream-4.5 --prompt "detective profile" \
  | dlazy veo-3.1 --image - --prompt "drone push-in, rainy night"

# List tools / inspect one
dlazy tools list
dlazy tools describe seedream-4.5

# Async tasks: submit and poll later
dlazy veo-3.1 --image hero.png --prompt "..." --no-wait     # returns generateId
dlazy status gen_abc123 --wait
```

### Global Flags

| Flag | Effect |
|---|---|
| `--api-key <key>` | Override stored API key for this run |
| `--base-url <url>` | Override server (default: `DLAZY_BASE_URL` or `https://dlazy.com`) |
| `--verbose` | Debug logs to stderr |
| `--output <mode>` | stdout format — see *Output modes* below |
| `-l, --lang <locale>` | UI / help language: `en-US` or `zh-CN` |

### Output Modes (`--output`)

The CLI's stdout shape is controlled by `--output`. stderr always carries human-readable progress; stdout is the machine-readable channel.

| Mode | Stdout |
|---|---|
| `json` (default) | Full envelope `{ ok, result }` (or `{ ok: false, code, message }`) |
| `url` | One URL per line (only media outputs) |
| `text` | One text block per output (only text outputs) |

For ad-hoc projection, use the default `json` mode and `jq`:

```bash
URL=$(dlazy seedream-4.5 --prompt "logo" --output url)
curl -O "$URL"

dlazy script-gen --prompt "..." --output text > script.md

# Default JSON + jq — pick fields directly from the envelope.
dlazy seedream-4.5 --prompt "..." | jq -r '.result.outputs[0].url'
dlazy veo-3.1 --image hero.png --prompt "..." \
  | jq 'if .ok then .result else .message end'
```

### Pipelines

CLI flags accept reference tokens that pull values from piped stdin. References are resolved before any network call, so you compose tools without writing JSON paths into shell variables.

| Token | Meaning |
|---|---|
| `-` | Auto-pick from upstream — first output's primary value (scalar field) or all primary values (array field) |
| `@<n>` | n-th output's primary value (`@0` = first) |
| `@<n>.<path>` | jsonpath into the n-th output (e.g. `@0.url`, `@1.meta.fps`, `@0.text`) |
| `@*` | all outputs as an array of primary values |
| `@stdin` | the entire piped envelope |
| `@stdin:<path>` | jsonpath into the entire envelope (e.g. `@stdin:result.usage.creditsCost`) |

Examples:

```bash
# 1) Single image → video (auto-resolution)
dlazy seedream-4.5 --prompt "..." \
  | dlazy veo-3.1 --image - --prompt "drone shot"

# 2) Pick the 2nd image from a 4-up batch
dlazy seedream-4.5 --batch 4 --prompt "..." \
  | dlazy veo-3.1 --image @1.url --prompt "slow zoom"

# 3) Array field: upstream's URLs flatten in
dlazy seedream-4.5 --batch 4 --prompt "..." \
  | dlazy merge --videos -

# 4) Text from a prior tool drives a prompt
dlazy script-gen --prompt "6 cinematic shots" \
  | dlazy seedream-4.5 --prompt @stdin:result.outputs[0].text
```

References work for any flag — text prompts, urls, ids, anything. `--dry-run` shows the resolved input without calling the API.

### Local Files & Data URLs

Any media-typed flag accepts:

- `https://...` — passed through
- `data:image/png;base64,...` — uploaded to object storage, replaced with a URL
- `./path/to/file.png` — uploaded to object storage, replaced with a URL

```bash
dlazy seedream-4.5 --image ./hero.png --prompt "stylize as oil painting"
```

### Batch Generation

All generation tools (`image` / `video` / `audio` / `text` / `auto`) accept `--batch <n>`. The CLI runs the tool **N times in parallel** with the same input and merges every run's outputs into one envelope:

```bash
# 4 image variants in one call (parallel) — outputs[0..3]
dlazy seedream-4.5 --prompt "雨夜赛博朋克猫" --batch 4

# Combine with pipe references — feed every variant into a single merge
dlazy seedream-4.5 --prompt "..." --batch 4 \
  | dlazy veo-3.1 --image @0.url --prompt "镜头推进"
```

`usage.creditsCost` is summed across runs, `durationMs` reports parallel wallclock (max). With `--no-wait`, each sub-run's `task` is surfaced as a JSON output so downstream pipes can still read every `generateId`.

### Async Tasks

Long-running tools (most video models) return a `generateId` and the CLI polls until completion by default. Override:

```bash
dlazy veo-3.1 --image hero.png --no-wait              # return generateId immediately
dlazy status gen_abc123 --wait --tool veo-3.1         # block until done
dlazy status gen_abc123                                # one-shot status check
```

`--timeout <seconds>` controls the polling deadline (default 30 min).

### CLI Reference (per-tool help)

```bash
dlazy <tool> --help            # all flags + types + defaults + dependent options
dlazy tools describe <tool>    # full input / output JSON Schema
dlazy tools list               # registry overview
```

---

## SDK Quick Start

The SDK exposes the same runner as the CLI. Calls are **lazy**: each invocation returns a `Handle` that runs only when awaited or passed to `run()`. Handles can be wired into other handles' inputs to form a DAG that the runner schedules and memoizes.

```ts
import { sdk, run, configure } from "@dlazy/cli/sdk";

configure({ apiKey: process.env.DLAZY_API_KEY });

// One-shot (Handle is a thenable, awaiting it triggers run)
const result = await sdk.seedream_4_5({ prompt: "cyberpunk cat" });
console.log(result.outputs[0].url);
```

### Naming

Tool functions are flat (no `image.` / `video.` namespace). Both forms work:

```ts
// 1. Proxy access — identifier-safe alias (`-`/`.` → `_`)
sdk.seedream_4_5({ prompt: "..." })
sdk.wan2_6_r2v({ image: hero })
sdk.mj_imagine({ prompt: "..." })

// 2. Explicit tool() — accepts the raw cli_name
import { tool } from "@dlazy/cli/sdk";
tool("seedream-4.5", { prompt: "..." })
tool("wan2.6-r2v",   { image: hero })
```

The Proxy doesn't validate the tool name at call time; that happens lazily on `run()` so the manifest is only fetched when you actually execute.

### Building a DAG

Pass handles directly into other tools' inputs. The runner walks the graph topologically, resolves each handle's natural value (URL for media, text for text, …), and only calls `executeTool` once per handle.

```ts
import { sdk, run } from "@dlazy/cli/sdk";

const hero = sdk.seedream_4_5({ prompt: "detective in neon rain" });

// scenes is a list — handles inside arrays auto-resolve to scalars (their url)
const shots = ["wide push-in", "close-up", "tracking left"].map((desc) =>
  sdk.kling_image_o1({ prompt: desc, image: hero }),
);

const clips = shots.map((img) =>
  sdk.veo_3_1({ image: img, duration: 4 }),
);

// merge.videos is an array slot — passing the array of handles flattens
// each handle's url into the slot. A single handle in an array slot uses
// its full primary-value array.
const final = sdk.merge({ videos: clips });

const result = await run(final);
console.log(result.outputs[0].url);
```

### Lazy vs Eager

`Handle` is a `PromiseLike`. Awaiting it (eager) is identical to calling `run(handle)`:

```ts
const handle = sdk.seedream_4_5({ prompt: "..." });   // synchronous, no API call
const result = await handle;                           // ← API call happens here
// equivalent:
const result2 = await run(handle);
```

Inside a DAG you usually don't `await` intermediate handles — pass them by reference and let the runner schedule them in one pass. `await` early only when you need the intermediate result in your own code (e.g. for a conditional branch).

### Configure

`configure()` is process-wide and additive. Call it once at startup or pass per-call options to `run()`.

```ts
configure({
  apiKey: "sk-...",                  // default: DLAZY_API_KEY env / ~/.dlazy
  baseUrl: "https://dlazy.com",      // default: DLAZY_BASE_URL env / dlazy.com
  organizationId: "org_abc",         // optional, defaults to your default org
  projectId: "proj_xyz",             // optional, scopes generations to a project
  noInteractive: true,               // skip device-code login on missing key
});
```

### Run Options

```ts
import { run } from "@dlazy/cli/sdk";

const result = await run(handle, {
  wait: true,            // default true; set false to return as soon as the task is queued
  timeoutMs: 30 * 60_000,// default 30 min
  batch: 1,              // default 1; >1 fans the handle out N times in parallel and merges outputs
});

if (result.task) {
  console.log("queued:", result.task.generateId);
}
```

Per-handle batch (overrides `RunOptions.batch`): pass `batch` in the input.

```ts
const fourImages = await sdk.seedream_4_5({ prompt: "...", batch: 4 });
console.log(fourImages.outputs.length); // 4
```

### Working with Outputs

`ToolResult.outputs` is always an array. Each output carries its own `type` and the fields specific to that type. Use the typed unions if you need narrowing.

```ts
import type { Output, MediaOutput, TextOutput } from "@dlazy/cli/sdk";
import { primaryValue } from "@dlazy/cli/sdk";

function urlOf(a: Output): string | undefined {
  if (a.type === "image" || a.type === "video" || a.type === "audio" || a.type === "file") {
    return a.url;
  }
  return undefined;
}

const result = await sdk.seedream_4_5({ prompt: "..." });
for (const a of result.outputs) {
  const v = primaryValue(a);   // url | text | shape | json value
  console.log(a.type, v);
}
```

Output shapes:

```ts
// image | video | audio | file
{ type, id, url, mimeType?, bytes?, width?, height?, durationMs?, fps?, thumbnailUrl?, meta? }

// text
{ type: "text", id, text, format?, meta? }

// shape (canvas tools)
{ type: "shape", id, shape, meta? }

// json (any non-media value, fallback)
{ type: "json", id, value, meta? }
```

### Error Handling

Errors throw `SdkError` with a stable `code` and `details` payload — same vocabulary the CLI uses for its `{ ok: false, code, message }` envelope.

```ts
import { SdkError } from "@dlazy/cli/sdk";

try {
  await sdk.veo_3_1({ image: hero, prompt: "..." });
} catch (err) {
  if (err instanceof SdkError) {
    if (err.code === "insufficient_balance") {
      // top up
    } else if (err.code === "task_failed") {
      console.error("provider error:", err.details);
    }
  }
  throw err;
}
```

Common codes: `unauthorized`, `forbidden`, `invalid_request`, `insufficient_balance`, `network_error`, `task_failed`, `timeout`, `tool_not_found`, `file_not_found`, `upload_failed`, `missing_field`.

### Inspect Tools at Runtime

```ts
import { describeTool, getManifest } from "@dlazy/cli/sdk";

const all = await getManifest();
console.log(all.tools.map((t) => t.cli_name));

const tool = await describeTool("seedream-4.5");
console.log(tool.inputJsonSchema);
console.log(tool.outputJsonSchema);
```

---

## ToolResult — Unified Output Contract

CLI and SDK both surface the same shape. CLI wraps it as `{ ok: true, result }` on stdout; SDK returns the inner `result` directly.

```ts
type ToolResult = {
  tool: string;        // cli_name, e.g. "seedream-4.5"
  modelId: string;     // server-side model id
  outputs: Output[];                  // always an array, never a scalar
  usage?: {
    creditsCost?: number;
    durationMs?: number;
    tokenIn?: number;
    tokenOut?: number;
  };
  task?: {                                 // present when wait=false / async
    generateId: string;
    status: "pending" | "running";
  };
};
```

Sample envelope (CLI default `--output json`):

```json
{
  "ok": true,
  "result": {
    "tool": "seedream-4.5",
    "modelId": "doubao-seedream-4_5",
    "outputs": [
      {
        "type": "image",
        "id": "a_8a1f3b7d",
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

---

## Supported Tools

A snapshot — run `dlazy tools list` to see the live registry, or `dlazy tools describe <name>` for full input/output schemas.

| Command | Type | Description |
|---|---|---|
| `seedream-4.5` | image | Doubao Seedream 4.5 high-quality text-to-image / reference-to-image. |
| `seedream-5.0-lite` | image | Doubao Seedream 5.0 fast image generation. |
| `banana2` / `banana-pro` | image | Gemini Banana general / pro text-to-image. |
| `gpt-image-2` | image | GPT Image 2 (text + reference image editing). |
| `grok-4.2` | image | Minimal text-to-image. |
| `recraft-v3` / `recraft-v3-svg` / `recraft-v4*` | image | Stylized / vector / pro variants. |
| `kling-image-o1` | image | Kling image (multi-image constraints). |
| `mj.imagine` | image | Midjourney-style. |
| `viduq2-t2i` / `jimeng-t2i` | image | Vidu / Jimeng text-to-image. |
| `imageseg` / `superres` | tool | Background removal / upscale. |
| `veo-3.1` / `veo-3.1-fast` | video | Veo high-quality / fast text-to-video. |
| `seedance-2.0` / `seedance-2.0-fast` / `seedance-1.5-pro` | video | ByteDance Seedance video. |
| `kling-v3` / `kling-v3-omni` | video | Kling V3 / omni-control video. |
| `wan2.6-r2v` / `wan2.6-r2v-flash` / `wan2.7` | video | Tongyi Wanxiang video. |
| `pixverse-c1` | video | PixVerse C1 (action / VFX). |
| `viduq2-i2v` | video | Vidu image-to-video. |
| `jimeng-i2v-first` / `jimeng-i2v-first-tail` / `jimeng-dream-actor` / `jimeng-omnihuman-1.5` | video | Jimeng video family. |
| `video-replicate` / `image-replicate` | video / image | Replicate-bridged models. |
| `video-scenes` / `merge` | video | Scene split / multi-clip merge. |
| `gemini-2.5-tts` | audio | Gemini 2.5 Pro TTS. |
| `keling-tts` / `doubao-tts` | audio | Kling / Doubao speech synthesis. |
| `keling-sfx` | audio | Sound effects / foley. |
| `suno.music` | audio | Suno music generation. |
| `vidu-audio-clone` / `kling-audio-clone` | audio | Voice cloning. |
| `plan` / `execute` | text | Workflow planning / execution. |
| `one-click-generation` | video | One-click full pipeline. |

---

## Runtime Requirements

- Node.js ≥ 18 (built for `node18` target; `fetch` and async iterators are required)
- The CLI ships as a single CJS bundle; the SDK is also CJS but re-exported via `package.json#exports` for both `require` and ESM `import`.

---

# 中文

**访问 https://dlazy.com 获取更多信息。**

`@dlazy/cli` 提供两套接口，共享同一个工具执行器：

- 终端命令 `dlazy`
- JavaScript / TypeScript SDK `@dlazy/cli/sdk`

两者输出统一的 **ToolResult** 信封，CLI 输出可直接管道喂给另一个 CLI，也可被 SDK 复用。

## 安装

```bash
# CLI（全局）
npm install -g @dlazy/cli

# SDK（项目内）
npm install @dlazy/cli
```

## 登录认证

```bash
dlazy login                 # 浏览器扫码登录
dlazy auth set sk-xxxx      # 直接设置 Token
dlazy auth get              # 查看当前 Token
dlazy logout                # 清除 Token
```

SDK 中：

```ts
import { configure } from "@dlazy/cli/sdk";
configure({ apiKey: process.env.DLAZY_API_KEY });
```

未传 `apiKey` 时按 `DLAZY_API_KEY` 环境变量 → `~/.dlazy/config.json` 顺序回退，与 CLI 一致。

## CLI 快速上手

```bash
# 单图生成
dlazy seedream-4.5 --prompt "雨夜赛博朋克猫"

# 两个工具串成管道（自动解析上游产物）
dlazy seedream-4.5 --prompt "侦探侧脸" \
  | dlazy veo-3.1 --image - --prompt "雨夜镜头推进"

# 列出 / 详查工具
dlazy tools list
dlazy tools describe seedream-4.5

# 异步任务：先提交，后查询
dlazy veo-3.1 --image hero.png --prompt "..." --no-wait
dlazy status gen_abc123 --wait
```

### 全局参数

| 参数 | 作用 |
|---|---|
| `--api-key <key>` | 覆盖本次运行的 API Key |
| `--base-url <url>` | 覆盖服务端地址（默认 `DLAZY_BASE_URL` 或 `https://dlazy.com`） |
| `--verbose` | 标准错误输出调试日志 |
| `--output <mode>` | 控制 stdout 形态，见下文 |
| `-l, --lang <locale>` | 帮助/输出语言：`en-US` 或 `zh-CN` |

### 输出模式 `--output`

stderr 始终是给人看的进度提示；stdout 由 `--output` 决定。

| 模式 | stdout 内容 |
|---|---|
| `json`（默认） | 完整信封 `{ ok, result }` 或 `{ ok: false, code, message }` |
| `url` | 每行一个 URL（仅媒体类 output） |
| `text` | 每行一段文本（仅 text 类 output） |

需要任意字段抽取时，直接用默认 `json` 模式 + `jq`：

```bash
URL=$(dlazy seedream-4.5 --prompt "logo" --output url)
curl -O "$URL"

dlazy script-gen --prompt "..." --output text > script.md

# 默认 JSON 模式 + jq，直接取信封字段
dlazy seedream-4.5 --prompt "..." | jq -r '.result.outputs[0].url'
dlazy veo-3.1 --image hero.png --prompt "..." \
  | jq 'if .ok then .result else .message end'
```

### 管道引用语法

CLI flag 值可使用引用语法，从上游 stdin 信封里取数据。所有引用在网络请求前替换完成。

| 语法 | 含义 |
|---|---|
| `-` | 自动选取 — 标量字段取首个 output 的 url/text/value，数组字段取全部 |
| `@<n>` | 第 n 个 output 的 primary value（`@0` 为第一个） |
| `@<n>.<path>` | 进入 output 内部字段（如 `@0.url`、`@1.meta.fps`、`@0.text`） |
| `@*` | 所有 outputs 的 primary value 数组 |
| `@stdin` | 整个 stdin 信封 |
| `@stdin:<path>` | 对整个信封做 jsonpath（如 `@stdin:result.usage.creditsCost`） |

示例：

```bash
# 1) 单图自动接到视频
dlazy seedream-4.5 --prompt "..." \
  | dlazy veo-3.1 --image - --prompt "雨夜推进"

# 2) 取 4 张图里第 2 张
dlazy seedream-4.5 --batch 4 --prompt "..." \
  | dlazy veo-3.1 --image @1.url --prompt "缓推"

# 3) 数组字段：上游全部 url 自动展开
dlazy seedream-4.5 --batch 4 --prompt "..." \
  | dlazy merge --videos -

# 4) 上游文本驱动 prompt
dlazy script-gen --prompt "6 个分镜" \
  | dlazy seedream-4.5 --prompt @stdin:result.outputs[0].text
```

引用对所有 flag 都生效（prompt、url、id 都行）。`--dry-run` 可以查看引用替换后的 input，不真正调用 API。

### 本地文件与 Data URL

媒体字段（`--image`、`--video`、`--audio` 等）支持三种值：

- `https://...` — 原样传入
- `data:image/png;base64,...` — 自动上传到对象存储后替换为 URL
- `./path/to/file.png` — 自动上传到对象存储后替换为 URL

```bash
dlazy seedream-4.5 --image ./hero.png --prompt "油画风格"
```

### 批量生成

所有生成类工具（`image` / `video` / `audio` / `text` / `auto`）都支持 `--batch <n>`，CLI 会用同一份输入**并行执行 N 次**，并把每次的 outputs 合并到同一个信封：

```bash
# 一次出 4 张图（并行），合并到 outputs[0..3]
dlazy seedream-4.5 --prompt "雨夜赛博朋克猫" --batch 4

# 配合管道引用：4 张图直接喂给下一个工具
dlazy seedream-4.5 --prompt "..." --batch 4 \
  | dlazy veo-3.1 --image @0.url --prompt "镜头推进"
```

`usage.creditsCost` 会跨子任务求和；`durationMs` 取并行墙钟（最大值）。配合 `--no-wait` 时，每个子任务的 `task` 会以 json 类型 output 的形式落到 outputs 数组里，方便下游管道继续读取所有 `generateId`。

### 异步任务

视频类工具大多是异步任务，CLI 默认会轮询直到完成。手动控制：

```bash
dlazy veo-3.1 --image hero.png --no-wait                  # 立即返回 generateId
dlazy status gen_abc123 --wait --tool veo-3.1             # 阻塞直到完成
dlazy status gen_abc123                                    # 单次查询
```

`--timeout <seconds>` 控制轮询超时（默认 30 分钟）。

### 工具帮助

```bash
dlazy <tool> --help            # 该工具所有参数 / 默认值 / 依赖关系
dlazy tools describe <tool>    # 完整 input / output JSON Schema
dlazy tools list               # 注册表概览
```

## SDK 快速上手

SDK 与 CLI 共享同一个执行器。每次调用返回**惰性 Handle**，await 或 `run()` 时才真正发起请求。Handle 之间可互为输入，构成 DAG，由 runner 拓扑调度并对相同 Handle 做记忆化。

```ts
import { sdk, run, configure } from "@dlazy/cli/sdk";

configure({ apiKey: process.env.DLAZY_API_KEY });

// 单次调用：Handle 即 thenable，await 自动触发 run
const result = await sdk.seedream_4_5({ prompt: "雨夜赛博朋克猫" });
console.log(result.outputs[0].url);
```

### 命名

工具函数扁平命名，没有 `image.` / `video.` 分组。两种调用都行：

```ts
// 1) Proxy（标识符安全名：`-` / `.` → `_`）
sdk.seedream_4_5({ prompt: "..." })
sdk.wan2_6_r2v({ image: hero })
sdk.mj_imagine({ prompt: "..." })

// 2) tool() 显式（接收原始 cli_name）
import { tool } from "@dlazy/cli/sdk";
tool("seedream-4.5", { prompt: "..." })
tool("wan2.6-r2v",   { image: hero })
```

Proxy 不在调用时校验工具是否存在；校验发生在 `run()` 时（manifest 也是这时才懒加载）。

### 构造 DAG

把 Handle 直接传到下游工具的 input 里。Runner 自动拓扑排序、解析每个 Handle 的"自然值"（媒体类取 url、文本类取 text…），同一个 Handle 只会执行一次。

```ts
import { sdk, run } from "@dlazy/cli/sdk";

const hero = sdk.seedream_4_5({ prompt: "雨夜霓虹下的侦探" });

// 数组里的 Handle 自动解析为标量（url）
const shots = ["远景推进", "侧脸特写", "向左跟随"].map((desc) =>
  sdk.kling_image_o1({ prompt: desc, image: hero }),
);

const clips = shots.map((img) =>
  sdk.veo_3_1({ image: img, duration: 4 }),
);

// merge.videos 是数组字段：传 Handle 数组时每个 Handle 的 url 被铺开；
// 传单个 Handle 时使用其全部 primary values。
const final = sdk.merge({ videos: clips });

const result = await run(final);
console.log(result.outputs[0].url);
```

### 惰性 vs 立即

`Handle` 是 `PromiseLike`。await 它等价于 `run(handle)`：

```ts
const handle = sdk.seedream_4_5({ prompt: "..." });   // 同步，未调用 API
const result = await handle;                           // ← 此时才发请求
// 等价：
const result2 = await run(handle);
```

DAG 里中间节点通常不要 await，让 runner 一次性调度。只有当你的代码本身需要根据中间结果分支时才 early await。

### 配置

`configure()` 进程级、可叠加，启动时调一次即可：

```ts
configure({
  apiKey: "sk-...",                  // 默认：DLAZY_API_KEY 环境变量 / ~/.dlazy
  baseUrl: "https://dlazy.com",      // 默认：DLAZY_BASE_URL 环境变量 / dlazy.com
  organizationId: "org_abc",         // 可选，默认使用账号默认组织
  projectId: "proj_xyz",             // 可选，按项目计费/归档
  noInteractive: true,               // 缺 Key 时不打开浏览器登录
});
```

### Run 选项

```ts
import { run } from "@dlazy/cli/sdk";

const result = await run(handle, {
  wait: true,             // 默认 true；false 表示提交后立即返回 task
  timeoutMs: 30 * 60_000, // 默认 30 分钟
  batch: 1,               // 默认 1；>1 时同 input 并行执行 N 次,outputs 合并
});

if (result.task) {
  console.log("已排队:", result.task.generateId);
}
```

Handle 级别批量（优先级高于 `RunOptions.batch`）：在 input 里传 `batch`。

```ts
const fourImages = await sdk.seedream_4_5({ prompt: "...", batch: 4 });
console.log(fourImages.outputs.length); // 4
```

### 处理输出 (Outputs)

`ToolResult.outputs` 始终是数组。每个 output 自带 `type` 和该类型特有字段。需要类型收窄时用联合类型。

```ts
import type { Output, MediaOutput, TextOutput } from "@dlazy/cli/sdk";
import { primaryValue } from "@dlazy/cli/sdk";

const result = await sdk.seedream_4_5({ prompt: "..." });
for (const a of result.outputs) {
  const v = primaryValue(a);   // url | text | shape | json value
  console.log(a.type, v);
}
```

Output 形状：

```ts
// image | video | audio | file
{ type, id, url, mimeType?, bytes?, width?, height?, durationMs?, fps?, thumbnailUrl?, meta? }

// text
{ type: "text", id, text, format?, meta? }

// shape（画布工具）
{ type: "shape", id, shape, meta? }

// json（兜底，用于任何非媒体的输出）
{ type: "json", id, value, meta? }
```

### 错误处理

错误抛出 `SdkError`，带稳定的 `code` 和 `details`，与 CLI 失败信封 `{ ok: false, code, message }` 同源：

```ts
import { SdkError } from "@dlazy/cli/sdk";

try {
  await sdk.veo_3_1({ image: hero, prompt: "..." });
} catch (err) {
  if (err instanceof SdkError) {
    if (err.code === "insufficient_balance") {
      // 充值
    } else if (err.code === "task_failed") {
      console.error("服务端失败:", err.details);
    }
  }
  throw err;
}
```

常见 code：`unauthorized`、`forbidden`、`invalid_request`、`insufficient_balance`、`network_error`、`task_failed`、`timeout`、`tool_not_found`、`file_not_found`、`upload_failed`、`missing_field`。

### 运行时检视工具

```ts
import { describeTool, getManifest } from "@dlazy/cli/sdk";

const all = await getManifest();
console.log(all.tools.map((t) => t.cli_name));

const tool = await describeTool("seedream-4.5");
console.log(tool.inputJsonSchema);
console.log(tool.outputJsonSchema);
```

## ToolResult — 统一输出契约

CLI 和 SDK 输出同一种结构。CLI 在 stdout 包成 `{ ok: true, result }`，SDK 直接返回内部 `result`：

```ts
type ToolResult = {
  tool: string;          // cli_name，如 "seedream-4.5"
  modelId: string;       // 服务端模型 id
  outputs: Output[]; // 始终是数组，永远不是标量
  usage?: {
    creditsCost?: number;
    durationMs?: number;
    tokenIn?: number;
    tokenOut?: number;
  };
  task?: {               // wait=false 或异步任务时存在
    generateId: string;
    status: "pending" | "running";
  };
};
```

CLI 默认 `--output json` 的成功信封：

```json
{
  "ok": true,
  "result": {
    "tool": "seedream-4.5",
    "modelId": "doubao-seedream-4_5",
    "outputs": [
      {
        "type": "image",
        "id": "a_8a1f3b7d",
        "url": "https://cdn.dlazy.com/...png",
        "mimeType": "image/png"
      }
    ]
  }
}
```

失败信封：

```json
{ "ok": false, "code": "insufficient_balance", "message": "...", "details": {} }
```

## 支持的工具

下表为快照，请用 `dlazy tools list` 查看实时注册表，用 `dlazy tools describe <name>` 查看完整 schema。

| 命令 | 类型 | 说明 |
|---|---|---|
| `seedream-4.5` | 图片 | 豆包 Seedream 4.5 高质量文生图 / 参考图生图 |
| `seedream-5.0-lite` | 图片 | 豆包 Seedream 5.0 轻量高速生成 |
| `banana2` / `banana-pro` | 图片 | Gemini Banana 通用 / Pro 文生图 |
| `gpt-image-2` | 图片 | GPT Image 2（文 + 参考图编辑） |
| `grok-4.2` | 图片 | 极简文生图 |
| `recraft-v3` / `recraft-v3-svg` / `recraft-v4*` | 图片 | 风格化 / 矢量 / Pro 系列 |
| `kling-image-o1` | 图片 | 可灵图像（多图占位约束） |
| `mj.imagine` | 图片 | Midjourney 风格 |
| `viduq2-t2i` / `jimeng-t2i` | 图片 | Vidu / 即梦文生图 |
| `imageseg` / `superres` | 工具 | 抠图 / 超分辨率 |
| `veo-3.1` / `veo-3.1-fast` | 视频 | Veo 高质量 / 极速版文生视频 |
| `seedance-2.0` / `seedance-2.0-fast` / `seedance-1.5-pro` | 视频 | 字节 Seedance 视频 |
| `kling-v3` / `kling-v3-omni` | 视频 | 可灵 V3 / 全控版 |
| `wan2.6-r2v` / `wan2.6-r2v-flash` / `wan2.7` | 视频 | 通义万相视频 |
| `pixverse-c1` | 视频 | PixVerse C1（动作 / 特效） |
| `viduq2-i2v` | 视频 | Vidu 图生视频 |
| `jimeng-i2v-first` / `jimeng-i2v-first-tail` / `jimeng-dream-actor` / `jimeng-omnihuman-1.5` | 视频 | 即梦视频系列 |
| `video-replicate` / `image-replicate` | 视频 / 图片 | Replicate 桥接模型 |
| `video-scenes` / `merge` | 视频 | 分镜切割 / 多片段合并 |
| `gemini-2.5-tts` | 音频 | Gemini 2.5 Pro TTS |
| `keling-tts` / `doubao-tts` | 音频 | 可灵 / 豆包语音合成 |
| `keling-sfx` | 音频 | 音效 / 拟音 |
| `suno.music` | 音频 | Suno 音乐生成 |
| `vidu-audio-clone` / `kling-audio-clone` | 音频 | 声音克隆 |
| `plan` / `execute` | 文本 | 工作流规划 / 执行 |
| `one-click-generation` | 视频 | 一键全流程生成 |

## 运行环境

- Node.js ≥ 18（构建目标 `node18`，依赖 `fetch` 和异步迭代器）
- CLI / SDK 都打包为 CJS，并通过 `package.json#exports` 同时支持 `require` 与 ESM `import`。
