# @dlazy/cli

[English](./README.md) · **中文**

`@dlazy/cli` 提供两套接口，共享同一个工具执行器：

- **CLI**（`dlazy`）—— 终端命令，方便 Shell 管道串联。
- **SDK**（`@dlazy/cli`）—— JavaScript / TypeScript 模块，方便代码调用。

两者输出统一的 **ToolResult** 信封，CLI 输出可直接管道喂给另一个 CLI，也可被 SDK 复用。

> 访问 **https://dlazy.com/docs** 获取更多信息。

---

## 安装

```bash
# CLI（全局）
npm install -g @dlazy/cli

# SDK（项目内）
npm install @dlazy/cli
# 或：pnpm add @dlazy/cli   |   yarn add @dlazy/cli
```

## 登录认证

```bash
dlazy login                 # 设备码流程，浏览器扫码授权后保存到 ~/.dlazy/config.json
dlazy login --local         # 使用 http://localhost:3000，便于本地服务端联调
dlazy auth set sk-xxxx      # 直接写入 Token
dlazy auth get              # 查看当前 Token（已脱敏）
dlazy auth get --show       # 显示完整 Token
dlazy logout                # 从配置中清除 Token
```

运行时的 API Key 解析顺序：`--api-key` 参数 → `DLAZY_API_KEY` 环境变量 → `~/.dlazy/config.json` → 交互式登录（仅在 TTY 下触发）。

SDK 中：

```ts
import { configure } from '@dlazy/cli'
configure({ apiKey: process.env.DLAZY_API_KEY })
```

未传 `apiKey` 时与 CLI 走同一条回退链。

---

## CLI 快速上手

```bash
# 单图生成
dlazy gpt-image-2 --prompt "雨夜赛博朋克猫"

# 两个工具串成管道（自动解析上游产物）
dlazy gpt-image-2 --prompt "侦探侧脸" \
  | dlazy veo-3.1 --image - --prompt "雨夜镜头推进"

# 列出 / 详查工具
dlazy tools list
dlazy tools describe gpt-image-2

# 异步任务：先提交，后查询
dlazy veo-3.1 --image hero.png --prompt "..." --no-wait
dlazy status gen_abc123 --wait
```

### 全局参数

| 参数                  | 作用                                                           |
| --------------------- | -------------------------------------------------------------- |
| `--api-key <key>`     | 覆盖本次运行的 API Key                                         |
| `--base-url <url>`    | 覆盖服务端地址（默认 `DLAZY_BASE_URL` 或 `https://dlazy.com`） |
| `--verbose`           | 在 stderr 输出调试日志                                         |
| `--output <mode>`     | 控制 stdout 形态：`json`（默认） / `url` / `text`              |
| `-l, --lang <locale>` | 帮助 / 输出语言：`en-US` 或 `zh-CN`                            |

语言也会按 `DLAZY_LANG` → `LC_ALL` → `LANG` 顺序回退识别。

### 单次运行参数（每个工具命令通用）

| 参数                   | 作用                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `--dry-run`            | 解析所有引用并回显 payload，不做鉴权 / 上传 / 联网                                          |
| `--no-wait`            | 异步工具：立刻返回 `{ generateId, status }`                                                 |
| `--timeout <seconds>`  | 异步任务的轮询超时（默认 1800 秒）                                                          |
| `--input <jsonOrFile>` | 内联 JSON 对象，或 `@path/to/file.json`；与 flag 合并，flag 值优先                          |
| `--batch <n>`          | 同 input 并行执行 N 次，outputs 合并（仅对 image / video / audio / text / auto 类工具有效） |

### 输出模式 `--output`

stderr 始终是给人看的进度提示；stdout 由 `--output` 决定。

| 模式           | stdout 内容                                                 |
| -------------- | ----------------------------------------------------------- |
| `json`（默认） | 完整信封 `{ ok, result }` 或 `{ ok: false, code, message }` |
| `url`          | 每行一个 URL（仅媒体类 output）                             |
| `text`         | 每行一段文本（仅 text 类 output）                           |

需要任意字段抽取时，使用默认 `json` 模式 + `jq`：

```bash
URL=$(dlazy gpt-image-2 --prompt "logo" --output url)
curl -O "$URL"

# script 输出结构化分镜 JSON；用 jq 提取 markdown 渲染
dlazy script --prompt "6 个流浪猫的电影分镜" \
  | jq -r '.result.outputs[0].value.texts[0]' > script.md

# 默认 JSON 模式 + jq，直接取信封字段
dlazy gpt-image-2 --prompt "..." | jq -r '.result.outputs[0].url'
dlazy veo-3.1 --image hero.png --prompt "..." \
  | jq 'if .ok then .result else .message end'
```

### 管道引用语法

CLI flag 值可使用引用语法，从上游 stdin 信封里取数据。所有引用在网络请求前替换完成。

| 语法            | 含义                                                                |
| --------------- | ------------------------------------------------------------------- |
| `-`             | 自动选取 —— 标量字段取首个 output 的 url/text/value，数组字段取全部 |
| `@<n>`          | 第 n 个 output 的 primary value（`@0` 为第一个）                    |
| `@<n>.<path>`   | 进入 output 内部字段（如 `@0.url`、`@1.meta.fps`、`@0.text`）       |
| `@*`            | 所有 outputs 的 primary value 数组                                  |
| `@stdin`        | 整个 stdin 信封                                                     |
| `@stdin:<path>` | 对整个信封做 jsonpath（如 `@stdin:result.usage.creditsCost`）       |

示例：

```bash
# 1) 单图自动接到视频
dlazy gpt-image-2 --prompt "..." \
  | dlazy veo-3.1 --image - --prompt "雨夜推进"

# 2) 取 4 张图里第 2 张
dlazy gpt-image-2 --batch 4 --prompt "..." \
  | dlazy veo-3.1 --image @1.url --prompt "缓推"

# 3) 数组字段：上游全部 url 自动展开
dlazy gpt-image-2 --batch 4 --prompt "..." \
  | dlazy merge --videos -

# 4) script 输出的分镜文本驱动下一个 prompt
dlazy script --prompt "6 个流浪猫的电影分镜" \
  | dlazy gpt-image-2 --prompt @stdin:result.outputs[0].value.storyboards[0].firstFramePrompt
```

引用对所有 flag 都生效（prompt、url、id 都可以）。`--dry-run` 可以查看引用替换后的 input，不真正调用 API。

### 本地文件与 Data URL

媒体字段（`--image`、`--video`、`--audio` 等）支持三种值：

- `https://...` —— 原样传入
- `data:image/png;base64,...` —— 自动上传到对象存储后替换为公开 URL
- `./path/to/file.png` —— 自动上传到对象存储后替换为公开 URL

```bash
dlazy gpt-image-2 --image ./hero.png --prompt "油画风格"
```

文件大于 100 MB 会有警告日志；大于 500 MB 会被直接拒绝。

### 批量生成

所有生成类工具（`image` / `video` / `audio` / `text` / `auto`）都支持 `--batch <n>`，CLI 会用同一份输入**并行执行 N 次**，并把每次的 outputs 合并到同一个信封：

```bash
# 一次出 4 张图（并行），合并到 outputs[0..3]
dlazy gpt-image-2 --prompt "雨夜赛博朋克猫" --batch 4

# 配合管道引用：4 张图直接喂给下一个工具
dlazy gpt-image-2 --prompt "..." --batch 4 \
  | dlazy veo-3.1 --image @0.url --prompt "镜头推进"
```

`usage.creditsCost` / `tokenIn` / `tokenOut` 会跨子任务求和；`durationMs` 取并行墙钟（最大值）。配合 `--no-wait` 时，每个子任务的 `task` 会以 json 类型 output 的形式落到 outputs 数组里，方便下游管道继续读取所有 `generateId`。

### 异步任务

视频类工具大多是异步任务，CLI 默认会轮询直到完成。手动控制：

```bash
dlazy veo-3.1 --image hero.png --no-wait                  # 立即返回 generateId
dlazy status gen_abc123 --wait --tool veo-3.1             # 阻塞直到完成（按工具的 outputSchema 解析）
dlazy status gen_abc123                                    # 单次查询
```

`--timeout <seconds>` 控制轮询超时（默认 30 分钟）。`status` 命令传 `--tool <cli_name>` 可按对应工具的 outputSchema 解析结果；不传则按原始 JSON 输出。

### 工具发现

```bash
dlazy <tool> --help            # 该工具所有参数 / 默认值 / 依赖关系
dlazy tools list               # 注册表概览
dlazy tools describe <tool>    # 完整 input / output JSON Schema
```

CLI 会把 manifest 缓存到 `~/.dlazy/manifest-<locale>.json`，TTL 24 小时，并在后台静默刷新。这样 `--help` 在弱网 / 离线下依然秒开。

---

## SDK 快速上手

SDK 与 CLI 共享同一个执行器。每次调用返回**惰性 Handle**，await 或 `run()` 时才真正发起请求。Handle 之间可互为输入，构成 DAG，由 runner 拓扑调度并对相同 Handle 做记忆化。

```ts
import { gpt_image_2, run, configure } from '@dlazy/cli'

configure({ apiKey: process.env.DLAZY_API_KEY })

// 单次调用：Handle 即 thenable，await 自动触发 run
const result = await gpt_image_2({ prompt: '雨夜赛博朋克猫' })
console.log(result.outputs[0].url)
```

### 命名

工具函数扁平命名，没有 `image.` / `video.` 分组。直接按标识符安全名（`-` / `.` → `_`）按需 import：

```ts
import { gpt_image_2, veo_3_1, wan2_6_r2v, mj_imagine } from '@dlazy/cli'

gpt_image_2({ prompt: '...' })
wan2_6_r2v({ image: hero })
mj_imagine({ prompt: '...' })

// 当 cli_name 是动态值时，使用 tool() 传原始 cli_name：
import { tool } from '@dlazy/cli'
tool('gpt-image-2', { prompt: '...' })
tool('wan2.6-r2v', { image: hero })
```

工具名不在调用时校验；校验发生在 `run()` 时（manifest 也是这时才懒加载）。

### 构造 DAG

把 Handle 直接传到下游工具的 input 里。Runner 自动拓扑排序、解析每个 Handle 的「自然值」（媒体类取 url、文本类取 text…），同一个 Handle 只会执行一次。

```ts
import { gpt_image_2, kling_image_o1, veo_3_1, merge, run } from '@dlazy/cli'

const hero = gpt_image_2({ prompt: '雨夜霓虹下的侦探' })

// 数组里的 Handle 自动解析为标量（url）
const shots = ['远景推进', '侧脸特写', '向左跟随'].map((desc) => kling_image_o1({ prompt: desc, image: hero }))

const clips = shots.map((img) => veo_3_1({ image: img, duration: 4 }))

// merge.videos 是数组字段：传 Handle 数组时每个 Handle 的 url 被铺开；
// 传单个 Handle 时使用其全部 primary values。
const final = merge({ videos: clips })

const result = await run(final)
console.log(result.outputs[0].url)
```

### 惰性 vs 立即

`Handle` 是 `PromiseLike`。await 它等价于 `run(handle)`：

```ts
import { gpt_image_2, run } from '@dlazy/cli'

const handle = gpt_image_2({ prompt: '...' }) // 同步，未调用 API
const result = await handle // ← 此时才发请求
// 等价：
const result2 = await run(handle)
```

DAG 里中间节点通常不要 await，让 runner 一次性调度。只有当你的代码本身需要根据中间结果分支时才提前 await。

### 配置

`configure()` 进程级、可叠加，启动时调一次即可：

```ts
configure({
  apiKey: 'sk-...', // 默认：DLAZY_API_KEY 环境变量 / ~/.dlazy
  baseUrl: 'https://dlazy.com', // 默认：DLAZY_BASE_URL 环境变量 / dlazy.com
  organizationId: 'org_abc', // 可选，默认使用账号默认组织
  projectId: 'proj_xyz', // 可选，按项目计费 / 归档
  noInteractive: true, // 缺 Key 时不打开浏览器登录
})
```

### Run 选项

```ts
import { run } from '@dlazy/cli'

const result = await run(handle, {
  wait: true, // 默认 true；false 表示提交后立即返回 task
  timeoutMs: 30 * 60_000, // 默认 30 分钟
  batch: 1, // 默认 1；>1 时同 input 并行执行 N 次，outputs 合并
})

if (result.task) {
  console.log('已排队:', result.task.generateId)
}
```

Handle 级别批量（优先级高于 `RunOptions.batch`）：在 input 里传 `batch`。

```ts
import { gpt_image_2 } from '@dlazy/cli'

const fourImages = await gpt_image_2({ prompt: '...', batch: 4 })
console.log(fourImages.outputs.length) // 4
```

### 处理输出

`ToolResult.outputs` 始终是数组。每个 output 自带 `type` 和该类型特有字段。需要类型收窄时用联合类型。

```ts
import type { Output, MediaOutput, TextOutput } from '@dlazy/cli'
import { primaryValue } from '@dlazy/cli'

import { gpt_image_2 } from '@dlazy/cli'

const result = await gpt_image_2({ prompt: '...' })
for (const o of result.outputs) {
  const v = primaryValue(o) // url | text | json value
  console.log(o.type, v)
}
```

Output 形状：

```ts
// image | video | audio | file
{ type, id, url, mimeType?, bytes?, width?, height?, durationMs?, fps?, thumbnailUrl?, meta? }

// text
{ type: "text", id, text, format?, meta? }

// json（兜底，用于任何非媒体的输出）
{ type: "json", id, value, meta? }
```

### 错误处理

错误抛出 `SdkError`，带稳定的 `code` 和 `details`，与 CLI 失败信封 `{ ok: false, code, message }` 同源：

```ts
import { veo_3_1, SdkError } from '@dlazy/cli'

try {
  await veo_3_1({ image: hero, prompt: '...' })
} catch (err) {
  if (err instanceof SdkError) {
    if (err.code === 'insufficient_balance') {
      // 充值
    } else if (err.code === 'task_failed') {
      console.error('服务端失败:', err.details)
    }
  }
  throw err
}
```

常见 code：`unauthorized`、`forbidden`、`invalid_request`、`insufficient_balance`、`network_error`、`task_failed`、`timeout`、`tool_not_found`、`file_not_found`、`file_too_large`、`upload_failed`、`missing_field`、`bad_ref`、`no_stdin`、`no_api_key`。

### 运行时检视工具

```ts
import { describeTool, getManifest } from '@dlazy/cli'

const all = await getManifest()
console.log(all.tools.map((t) => t.cli_name))

const tool = await describeTool('gpt-image-2')
console.log(tool.inputJsonSchema)
console.log(tool.outputJsonSchema)
```

---

## ToolResult —— 统一输出契约

CLI 和 SDK 输出同一种结构。CLI 在 stdout 包成 `{ ok: true, result }`，SDK 直接返回内部 `result`：

```ts
type ToolResult = {
  tool: string // cli_name，如 "seedream-4.5"
  modelId: string // 服务端模型 id
  outputs: Output[] // 始终是数组，永远不是标量
  usage?: {
    creditsCost?: number
    durationMs?: number
    tokenIn?: number
    tokenOut?: number
  }
  task?: {
    // wait=false 或异步任务时存在
    generateId: string
    status: 'pending' | 'running'
  }
}
```

CLI 默认 `--output json` 的成功信封：

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

失败信封：

```json
{ "ok": false, "code": "insufficient_balance", "message": "...", "details": {} }
```

退出码：成功 `0`；运行时 / 网络错误 `1`；输入 / 配置错误 `2`（缺字段、JSON 解析失败、未知工具、引用错误等）。

---

## 支持的工具

下表为快照，请用 `dlazy tools list` 查看实时注册表，用 `dlazy tools describe <name>` 查看完整 schema。

| 命令                                                                                         | 类型        | 说明                                                                                    |
| -------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| `seedream-4.5`                                                                               | 图片        | 豆包 Seedream 4.5 高质量文生图 / 参考图生图                                             |
| `seedream-5.0-lite`                                                                          | 图片        | 豆包 Seedream 5.0 轻量高速生成                                                          |
| `banana2` / `banana-pro`                                                                     | 图片        | Gemini Banana 通用 / Pro 文生图                                                         |
| `gpt-image-2`                                                                                | 图片        | GPT Image 2（文 + 参考图编辑）                                                          |
| `grok-4.2`                                                                                   | 图片        | 极简文生图                                                                              |
| `recraft-v3` / `recraft-v3-svg` / `recraft-v4*`                                              | 图片        | 风格化 / 矢量 / Pro 系列                                                                |
| `kling-image-o1`                                                                             | 图片        | 可灵图像（多图占位约束）                                                                |
| `mj-imagine`                                                                                 | 图片        | Midjourney 风格                                                                         |
| `viduq2-t2i` / `jimeng-t2i`                                                                  | 图片        | Vidu / 即梦文生图                                                                       |
| `imageseg` / `superres`                                                                      | 工具        | 抠图 / 超分辨率                                                                         |
| `veo-3.1` / `veo-3.1-fast`                                                                   | 视频        | Veo 高质量 / 极速版文生视频                                                             |
| `seedance-2.0` / `seedance-2.0-fast` / `seedance-1.5-pro`                                    | 视频        | 字节 Seedance 视频                                                                      |
| `kling-v3` / `kling-v3-omni`                                                                 | 视频        | 可灵 V3 / 全控版                                                                        |
| `wan2.6-r2v` / `wan2.6-r2v-flash` / `wan2.7`                                                 | 视频        | 通义万相视频                                                                            |
| `pixverse-c1`                                                                                | 视频        | PixVerse C1（动作 / 特效）                                                              |
| `viduq2-i2v`                                                                                 | 视频        | Vidu 图生视频                                                                           |
| `jimeng-i2v-first` / `jimeng-i2v-first-tail` / `jimeng-dream-actor` / `jimeng-omnihuman-1.5` | 视频        | 即梦视频系列                                                                            |
| `video-replicate` / `image-replicate`                                                        | 视频 / 图片 | Replicate 桥接模型                                                                      |
| `video-scenes` / `merge`                                                                     | 视频        | 分镜切割 / 多片段合并                                                                   |
| `gemini-2.5-tts`                                                                             | 音频        | Gemini 2.5 Pro TTS                                                                      |
| `keling-tts` / `doubao-tts`                                                                  | 音频        | 可灵 / 豆包语音合成                                                                     |
| `keling-sfx`                                                                                 | 音频        | 音效 / 拟音                                                                             |
| `suno-music`                                                                                 | 音频        | Suno 音乐生成                                                                           |
| `vidu-audio-clone` / `kling-audio-clone`                                                     | 音频        | 声音克隆                                                                                |
| `plan` / `execute`                                                                           | 文本        | 工作流规划 / 执行                                                                       |
| `script`                                                                                     | 文本        | 分镜脚本生成：从自由文本简介（可选参考图）产出结构化的 subjects 主体 + storyboards 分镜 |
| `one-click-generation`                                                                       | 视频        | 一键全流程生成                                                                          |

---

## 运行环境

- Node.js ≥ 18（构建目标 `node18`，依赖 `fetch` 和异步迭代器）。
- CLI / SDK 都打包为 CJS，并通过 `package.json#exports` 同时支持 `require` 与 ESM `import`。
