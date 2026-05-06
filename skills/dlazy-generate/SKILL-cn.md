---
name: dlazy-generate
version: 1.1.1
description: 综合生成技能。能够根据用户意图自动选择合适的 dlazy CLI 模型来生成图片、视频或音频。
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.9","installAlternative":"npx @dlazy/cli@1.0.9","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","files.dlazy.com"]},"openclaw":{"systemPrompt":"当调用此技能时，请自动选择对应的 dlazy 子命令执行。"}}
---

# dlazy-generate

[English](./SKILL.md) · [中文](./SKILL-cn.md)


综合生成技能。能够根据用户意图自动选择合适的 dlazy CLI 模型来生成图片、视频或音频。

## Trigger Keywords / 触发关键词

- 生成
- 创建图片、视频、音频
- 多模态生成

## 身份验证 (Authentication)

所有请求都需要 dLazy API key。**推荐使用** `dlazy login` 完成登录：

```bash
dlazy login
```

该命令使用设备码流程（远程终端也可用），登录成功后 **自动把 API key 写入本地 CLI 配置**，无需手动复制粘贴。

### 备选：手动设置 API Key

如果你已有 API key，也可以直接保存：

```bash
dlazy auth set YOUR_API_KEY
```

CLI 会把 key 保存在你的用户配置目录（macOS/Linux 上为 `~/.dlazy/config.json`，Windows 上为 `%USERPROFILE%\.dlazy\config.json`），文件权限仅限当前操作系统用户访问。你也可以用 `DLAZY_API_KEY` 环境变量按次传入。

### 手动获取 API Key

1. 登录或在 [dlazy.com](https://dlazy.com) 创建账号
2. 访问 [dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key)
3. 复制 API Key 区域显示的密钥

每个 key 都属于你自己的 dLazy 组织，可在同一控制面板**随时轮换或吊销**。




## 关于与来源 (Provenance)

- **CLI 源代码**: [github.com/dlazyai/cli](https://github.com/dlazyai/cli)
- **维护者**: dlazyai
- **npm 包名**: `@dlazy/cli`（本技能 install 字段固定到 `1.0.9` 版本）
- **官网**: [dlazy.com](https://dlazy.com)

如果你不希望在系统上长期保留一个全局 CLI，可以按需运行：

```bash
npx @dlazy/cli@1.0.9 <command>
```

如选择全局安装，技能的 `metadata.clawdbot.install` 字段已固定到 `npm install -g @dlazy/cli@1.0.9`。安装前建议先到 GitHub 仓库审阅源码。

## 工作原理

此技能是 dLazy 托管 API 的轻量封装。调用时：

- 你提供的提示词与参数会发送到 dLazy API（`api.dlazy.com`）进行推理。
- 传入图像 / 视频 / 音频字段的本地文件路径会被 CLI 上传到 dLazy 媒体存储（`files.dlazy.com`），以便模型读取 —— 与任何云端生成 API 的流程一致。
- API 返回的生成结果 URL 由 `files.dlazy.com` 托管。

这是标准的 SaaS 调用模式；技能本身不会越权访问网络或文件系统，所有动作都由 dLazy CLI 完成。完整服务条款请参见 [dlazy.com](https://dlazy.com)。

## 命令间管道 (Piping)

每次 `dlazy` 调用都会向 stdout 输出一个 JSON 信封。任意参数都可以使用 **管道引用** 直接从上游命令的信封里取值，避免手工复制 URL。

| 引用语法              | 含义                                                            |
| --------------------- | --------------------------------------------------------------- |
| `-`                   | 上游为该字段提供的自然值（标量或数组按字段类型自动选取）        |
| `@N`                  | 第 N 个 output 的主值（如 `@0` 为第一个 output 的 url）         |
| `@N.<jsonpath>`       | 进入第 N 个 output 的字段（`@0.url`, `@1.meta.fps`）            |
| `@*`                  | 所有 output 的主值组成的数组                                    |
| `@stdin`              | 上游完整的 JSON 信封                                            |
| `@stdin:<jsonpath>`   | 在完整信封上做 jsonpath（`@stdin:result.outputs[0].url`）       |

### 示例

```bash
# 文生图后直接把图喂给图生视频
dlazy seedream-4.5 --prompt "雪地里的红狐" \
  | dlazy kling-v3 --image - --prompt "狐狸开始奔跑"

# 文生图 + TTS 配音（拿第一个 output 的 url 作为画面）
dlazy seedream-4.5 --prompt "黎明的灯塔" \
  | dlazy keling-tts --text "欢迎来到海岸。" --image @0.url

# 批量分发：把上游所有 output 的 url 一次性传给批处理步骤
dlazy seedream-4.5 --prompt "城市天际线" --n 4 \
  | dlazy superres --images @*
```

> 必填参数也可以完全由管道提供 —— 当上游存在对应值时，`--field -` 即可满足必填校验。若 stdin 为空，CLI 会以 `code: "no_stdin"` 报错。

## 使用方法

这是一个综合技能，它会根据用户的意图，自动将生成请求路由到合适的 `dlazy` 模型。

### 按分类可用的模型

**图片生成 (Image):**

- `dlazy gpt-image-2`: GPT Image 2 文生图及图片编辑模型。支持纯文本生成图片，也支持传入参考图进行图像编辑与合成。
- `dlazy seedream-4.5`: 高质量文生图/参考图生图模型，适合海报、写实与创意场景。支持 prompt + 多张参考图，输出单张高分辨率图片（2K/4K）。
- `dlazy seedream-5.0-lite`: 轻量高速图像生成模型，适合批量出图、草图探索与低成本迭代。支持 prompt + 参考图，输出 2K/3K 图片。
- `dlazy banana2`: 通用文生图模型（可选 1 张参考图），强调速度与性价比。适合快速视觉草稿、社媒配图与多尺寸比例生成。
- `dlazy banana-pro`: 高质量文生图模型（可选 1 张参考图），适合细节要求更高的主视觉、产品图与品牌风格图生成。
- `dlazy grok-4.2`: 极简文生图模型，仅需 prompt。适合快速验证创意或对质量要求一般的即时出图场景。
- `dlazy recraft-v3`: 风格化文生图模型，支持比例与风格控制（写实/插画等）。适合品牌 KV、海报与风格统一的视觉内容。
- `dlazy recraft-v3-svg`: 文本到矢量图模型，输出偏 SVG/矢量风格结果。适合 Logo、图标、线稿与可无损缩放的设计素材生成。
- `dlazy recraft-v4`: 1MP 栅格图像生成，具备更精炼的设计判断力。适合日常创意工作和快速迭代场景。
- `dlazy recraft-v4-vector`: 文本到矢量图模型，输出 SVG 结果。适合 Logo、图标与可无损缩放的设计素材。
- `dlazy recraft-v4-pro`: 4MP 高分辨率栅格图像生成。适合可印刷级素材与大幅面应用场景。
- `dlazy recraft-v4-pro-vector`: 高保真文本到矢量模型，4MP 级品质。适合生产级 SVG 素材与精细插画。
- `dlazy mj-imagine`: Midjourney 风格出图入口，支持画幅、Bot 类型与输出位（grid/U1-U4）。适合艺术化、风格强烈的创意图生成。
- `dlazy kling-image-o1`: Kling 图像模型，支持在 prompt 中使用 '<image_1>' 占位符进行参考图绑定。适合多图条件约束与高保真生成。
- `dlazy viduq2-t2i`: Vidu 图像生成模型，支持文本+参考图、比例与分辨率控制。适合角色图、封面图和高分辨率图像生成。
- `dlazy jimeng-t2i`: 即梦高分辨率文生图模型，支持多比例超清输出与参考图约束，适合商业视觉与精细化出图。
- `dlazy imageseg`: 图像抠图工具：分离前景与背景并返回透明底结果 URL，适合商品图处理、人物抠像与二次合成。
- `dlazy image-replicate`: 图片复刻工具：分析源图的画面、构图、色彩、光线与风格，生成复刻提示词并交由 Seedream 4.5 生成同风格新图。
- `dlazy superres`: 图像超分工具：提升图片清晰度与细节并返回增强后 URL，适合低清素材修复与二次放大输出。

**视频生成 (Video):**

- `dlazy seedance-2.0`: 字节最新视频生成模型，支持多模态参考生视频（图片+视频+音频）、首尾帧及文生视频，适合高质量多样化视频创作。
- `dlazy seedance-2.0-fast`: 字节最新视频生成模型 Fast 版，生成速度更快，支持多模态参考生视频、首尾帧及文生视频。
- `dlazy veo-3.1`: 高质量视频生成模型，支持文本生视频与单图驱动视频。适合广告短片、镜头感强的成片生成（速度较慢、质量更高）。
- `dlazy happyhorse-1.0`: Happy Horse 1.0 视频模型，一站式覆盖文生视频（t2v）、首帧生视频（i2v）、参考图生视频（r2v）与视频编辑（edit）：根据所选模式自动路由到对应子模型。
- `dlazy veo-3.1-fast`: 快速版视频生成模型，支持文本生视频与单图/多图/首尾帧驱动。适合时间敏感的预览与快速迭代场景。
- `dlazy kling-v3-omni`: Kling Omni 视频模型，支持多参考图、时长、模式（std/pro）与可选音频。适合高控制度的视频合成任务。
- `dlazy kling-v3`: Kling V3 通用视频模型，支持文本+最多 4 张参考图，适合稳定产出短视频片段与日常创作流程。
- `dlazy seedance-1.5-pro`: 字节高质量视频生成模型，支持文本生视频并可选首尾帧控制镜头过渡，适合叙事短片与动作连续性场景。
- `dlazy wan2.7`: 通义万相 2.7 视频生成模型，一站式覆盖文生视频、首尾帧生视频与参考图生视频：未提供图时走文生视频，提供首/尾帧时走首尾帧生视频，提供参考图时走参考图生视频。
- `dlazy wan2.6-r2v`: 通义万相视频生成模型（标准版），支持文本+参考图生成、分辨率与镜头类型控制，适合通用短视频制作。
- `dlazy wan2.6-r2v-flash`: 通义万相视频生成模型（Flash 版），更偏速度与吞吐，支持可选音频输出，适合批量生成与快速试错。
- `dlazy pixverse-c1`: 爱诗 PixVerse C1 视频生成模型（擅长打斗、法术特效、高速运动等高动态场景），一站式覆盖文生视频、图生视频、首尾帧生视频与参考图生视频：未提供图时走文生视频，仅首帧时走图生视频，首+尾帧时走首尾帧生视频，提供参考图时走参考图生视频。
- `dlazy viduq2-i2v`: Vidu 图生视频模型，支持参考图驱动视频、时长/分辨率/比例与音频参数配置，适合图片动效化与短片生成。
- `dlazy jimeng-i2v-first`: 即梦首帧生视频模型，使用首帧图+文本生成视频。适合让静态图片自然动起来的单镜头场景。
- `dlazy jimeng-i2v-first-tail`: 即梦首尾帧视频模型，支持首帧与尾帧约束以控制镜头起止状态，适合转场与动作收束明确的片段。
- `dlazy jimeng-dream-actor`: 即梦人物/动作驱动视频模型，支持参考图与参考视频输入，适合人物演绎、动作迁移与风格一致性生成。
- `dlazy jimeng-omnihuman-1.5`: 即梦同源数字人模型，支持任意画幅包含人物/主体的图片结合音频生成高质量数字人视频。
- `dlazy video-scenes`: 视频拆分分镜工具：使用 ffmpeg 进行场景检测与切分，仅返回按分镜切分后的视频片段 URL，不做视频内容理解。
- `dlazy video-replicate`: 视频复刻工具：从源视频中提取首帧与音频，并调用视频理解生成描述提示，输出 Seedance 2.0 复刻方案（首帧 + 音频 + 视频）三件套。
- `dlazy merge`: 音视频合并工具：按片段与时间轴配置合并多个视频和音频轨道，适合拼接成片、配乐与后期整合。
- `dlazy one-click-generation`: 短视频自动生成工具。支持自定义视频主题、文案、TTS 朗读、背景音乐与字幕样式。

**音频生成 (Audio):**

- `dlazy gemini-2.5-tts`: 基于 Gemini 的高质量文本转语音。支持双语（中/英）和多种情感音色。
- `dlazy suno-music`: Suno 音乐生成模型。支持灵感模式（自动作词）和自定义模式（手动填词），可生成包含人声或纯器乐的音乐。
- `dlazy keling-sfx`: 音效生成模型：可文本生音效，也可对参考视频生成配套音效/配乐。适合拟音、环境声与短视频声音补全。
- `dlazy keling-tts`: 文本转语音模型（TTS），可设置语言、音色、语速与输出格式。适合配音旁白、有声内容和语音播报。
- `dlazy doubao-tts`: 字节跳动豆包语音合成模型。支持多语言、多音色和高度自然的流式音频输出，适合新闻播报与有声读物。
- `dlazy vidu-audio-clone`: 复刻真人音色，并使用该音色朗读指定文本。
- `dlazy kling-audio-clone`: 自定义音色（可灵），复刻音色用于生成配音或与主体绑定

> **智能体关键指令**:
>
> 1. 确定用户请求的媒体类型（图片、视频或音频）。
> 2. 从上述列表中选择最合适的模型。
> 3. 运行 `dlazy <model_name> -h` 查看该特定模型所需的参数。
> 4. 执行命令（例如 `dlazy seedream-4.5 --prompt "..."`）。


## 错误处理

| Code | 错误类型                         | 示例信息                                                                                                                 |
| ---- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 401  | 未授权 (API Key缺失或无效)       | `ok: false, code: "unauthorized", message: "API key is missing or invalid"`                                                              |
| 501  | 缺少必填参数                     | `error: required option '--prompt <prompt>' not specified`                                                               |
| 502  | 本地文件读取失败                 | `Error: Image file/Video file not found: C:\path\to\your\file`                                                           |
| 503  | API 请求失败（余额不足）         | `ok: false, code: "insufficient_balance"` |
| 503  | API 请求失败（服务端错误）       | `HTTP status code error (500 server crash)`                                                                              |
| 504  | 异步任务执行失败                 | `=== Generation Failed ===` / `{后端返回的具体失败原因，比如 "Prompt violates safety policy"}`                             |

> **智能体关键指令**: 
> 1. 如果执行结果返回 `code: "insufficient_balance"` 且提示余额不足（Insufficient balance），您必须明确告知用户当前积分不足，并引导用户点击以下链接前往充值：[https://dlazy.com/dashboard/organization/settings?tab=credits](https://dlazy.com/dashboard/organization/settings?tab=credits)
> 2. 如果执行结果返回 `code: "unauthorized"` 或提示缺少 API Key，您必须明确告知用户前往 [https://dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key) 获取 API Key 并使用 `dlazy auth set <key>` 保存，然后继续执行任务。

## Tips

Visit https://dlazy.com for more information.