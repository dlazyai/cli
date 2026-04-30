---
name: dlazy-one-click-generation
version: 1.0.9
description: Short-video generation pipeline. Configure subject, script, TTS voiceover, BGM, and subtitle styling.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.9","installAlternative":"npx @dlazy/cli@1.0.9","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","files.dlazy.com"]},"openclaw":{"systemPrompt":"当调用此技能时，可以使用 dlazy one-click-generation -h 查看帮助信息。"}}
---

# dlazy-one-click-generation

[English](./SKILL.md) · [中文](./SKILL-cn.md)


Short-video generation pipeline. Configure subject, script, TTS voiceover, BGM, and subtitle styling.

## 触发关键词

- one-click-generation

## 身份验证 (Authentication)

所有请求都需要 dLazy API key，通过 CLI 配置：

```bash
dlazy auth set YOUR_API_KEY
```

CLI 会把 key 保存在你的用户配置目录（macOS/Linux 上为 `~/.dlazy/config.json`，Windows 上为 `%USERPROFILE%\.dlazy\config.json`），文件权限仅限当前操作系统用户访问。你也可以用 `DLAZY_API_KEY` 环境变量按次传入。

### 获取你的 API Key

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

## 使用方法

**CRITICAL INSTRUCTION FOR AGENT**:
执行 `dlazy one-click-generation` 命令获取结果。

```bash
dlazy one-click-generation -h

Options:
  --prompt [prompt]                    提示词
  --manual_script_terms [manual_script_terms]是否手动输入视频文案和关键词 [default: false]
  --video_script [video_script]        视频文案 [only when manual_script_terms="true"]
  --video_terms [video_terms]          视频关键词 [only when manual_script_terms="true"]
  --local_video_files [local_video_files]本地视频文件 [only when video_source="local"]
  --video_concat_mode [video_concat_mode]拼接模式 [default: random] (choices: "random", "sequential")
  --video_transition_mode [video_transition_mode]视频转场模式 [default: None] (choices: "None", "Shuffle", "FadeIn", "FadeOut", "SlideIn", "SlideOut")
  --video_aspect [video_aspect]        视频比例 [default: 9:16] (choices: "9:16", "16:9", "1:1")
  --video_clip_duration [video_clip_duration]视频片段最大时长(2-10s) [default: 3] (choices: "2", "3", "4", "5", "6", "7", "8", "9", "10")
  --video_count [video_count]          同时生成的视频数量(1-5) [default: 1] (choices: "1", "2", "3", "4", "5")
  --voice_region [voice_region]        声音地区 [default: zh-CN] (choices: "zh-CN", "zh-HK", "zh-TW")
  --voice_name [voice_name]            朗读声音 Options depend on "voice_region". when voice_region="zh-CN": zh-CN-XiaoxiaoNeural (晓晓 - 女声 / Xiaoxiao - Female), zh-CN-XiaoyiNeural (晓伊 - 女声 / Xiaoyi - Female), zh-CN-YunjianNeural (云健 - 男声 / Yunjian - Male), zh-CN-YunxiNeural (云希 - 男声 / Yunxi - Male), zh-CN-YunxiaNeural (云夏 - 男童声 / Yunxia - Boy), zh-CN-YunyangNeural (云扬 - 男声 / Yunyang - Male), zh-CN-liaoning-XiaobeiNeural (晓贝 - 东北女声 / Xiaobei - Liaoning Female), zh-CN-shaanxi-XiaoniNeural (晓妮 - 陕西女声 / Xiaoni - Shaanxi Female); when voice_region="zh-HK": zh-HK-HiuGaaiNeural (曉佳 - 粤语女声 / HiuGaai - Cantonese Female), zh-HK-HiuMaanNeural (曉曼 - 粤语女声 / HiuMaan - Cantonese Female), zh-HK-WanLungNeural (雲龍 - 粤语男声 / WanLung - Cantonese Male); when voice_region="zh-TW": zh-TW-HsiaoChenNeural (曉臻 - 台湾女声 / HsiaoChen - Taiwanese Female), zh-TW-HsiaoYuNeural (曉雨 - 台湾女声 / HsiaoYu - Taiwanese Female), zh-TW-YunJheNeural (雲哲 - 台湾男声 / YunJhe - Taiwanese Male) [default: zh-CN-XiaoxiaoNeural] [options depend on --voice_region; voice_region=zh-CN: zh-CN-XiaoxiaoNeural (晓晓 - 女声 / Xiaoxiao - Female), zh-CN-XiaoyiNeural (晓伊 - 女声 / Xiaoyi - Female), zh-CN-YunjianNeural (云健 - 男声 / Yunjian - Male), zh-CN-YunxiNeural (云希 - 男声 / Yunxi - Male), zh-CN-YunxiaNeural (云夏 - 男童声 / Yunxia - Boy), zh-CN-YunyangNeural (云扬 - 男声 / Yunyang - Male), zh-CN-liaoning-XiaobeiNeural (晓贝 - 东北女声 / Xiaobei - Liaoning Female), zh-CN-shaanxi-XiaoniNeural (晓妮 - 陕西女声 / Xiaoni - Shaanxi Female); voice_region=zh-HK: zh-HK-HiuGaaiNeural (曉佳 - 粤语女声 / HiuGaai - Cantonese Female), zh-HK-HiuMaanNeural (曉曼 - 粤语女声 / HiuMaan - Cantonese Female), zh-HK-WanLungNeural (雲龍 - 粤语男声 / WanLung - Cantonese Male); voice_region=zh-TW: zh-TW-HsiaoChenNeural (曉臻 - 台湾女声 / HsiaoChen - Taiwanese Female), zh-TW-HsiaoYuNeural (曉雨 - 台湾女声 / HsiaoYu - Taiwanese Female), zh-TW-YunJheNeural (雲哲 - 台湾男声 / YunJhe - Taiwanese Male)]
  --voice_volume [voice_volume]        朗读音量(1.0表示100%) [default: 1.0] (choices: "0.5", "0.8", "1.0", "1.2", "1.5", "2.0")
  --voice_rate [voice_rate]            朗读速度(1.0表示1倍速) [default: 1.0] (choices: "0.5", "0.8", "1.0", "1.2", "1.5", "2.0")
  --bgm_type [bgm_type]                背景音乐 [default: random] (choices: "random", "none")
  --bgm_volume [bgm_volume]            背景音乐音量 [default: 0.2] (choices: "0.0", "0.1", "0.2", "0.3", "0.4", "0.5", "0.8", "1.0")
  --subtitle_enabled [subtitle_enabled]是否启用字幕 [default: true]
  --font_name [font_name]              字幕字体 [default: MicrosoftYaHeiBold.ttc] (choices: "MicrosoftYaHeiBold.ttc", "MicrosoftYaHei.ttc")
  --subtitle_position [subtitle_position]字幕位置 [default: bottom] (choices: "bottom", "top", "center")
  --text_fore_color [text_fore_color]  字幕颜色 [default: #FFFFFF]
  --stroke_color [stroke_color]        描边颜色 [default: #000000]
  --font_size [font_size]              字幕大小 [default: 60] (choices: "30", "40", "50", "60", "70", "80", "90", "100")
  --stroke_width [stroke_width]        描边粗细 [default: 1.5] (choices: "0.0", "0.5", "1.0", "1.5", "2.0", "3.0", "5.0", "10.0")
  --dry-run                            Print payload + cost estimate without calling API
  --no-wait                            Return generateId immediately for async tasks
  --timeout <seconds>                  Max seconds to wait for async completion (default: "1800")
  -h, --help                           display help for command
```

> Any flag also accepts pipe references — `-` (auto-pick from upstream stdin), `@N` (n-th output), `@N.path` (jsonpath into output), `@*` (all primary values), `@stdin` / `@stdin:path` (whole envelope). See `dlazy --help` for details.

## 输出格式

```json
{
  "ok": true,
  "result": {
    "tool": "one-click-generation",
    "modelId": "moneyPrinterTurbo",
    "outputs": [
      {
        "type": "image",
        "id": "o_xxxxxxxx",
        "url": "https://files.dlazy.com/result.png",
        "mimeType": "image/png"
      }
    ]
  }
}
```

> Async tasks (when `--no-wait` is passed) return `outputs: []` and a `task: { generateId, status }` field instead. Use `dlazy status <generateId> --wait` to poll.

## 命令示例

```bash
dlazy one-click-generation --prompt '提示词内容'
```

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