---
name: dlazy-viduq2-t2i
version: 1.0.0
description: 使用 Vidu Q2 生成高质量图像，支持丰富的文生图与图生图指令。
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"当调用此技能时，可以使用 dlazy viduq2-t2i -h 查看帮助信息。"}}
---

# dlazy-viduq2-t2i

使用 Vidu Q2 生成高质量图像，支持丰富的文生图与图生图指令。

## 触发关键词

- vidu q2
- 生成图片、编辑图片
- 文生图、图生图

## 使用方法

**CRITICAL INSTRUCTION FOR AGENT**: 
执行 `dlazy viduq2-t2i` 命令获取结果。

```bash
dlazy viduq2-t2i -h

Options:
  --prompt <prompt>                    Prompt
  --generation_mode <generation_mode>  Generation Mode [default: components] (choices: "components")
  --images <images...>                 Images [image: url or local path] (max 10)
  --aspectRatio <aspectRatio>          Aspect Ratio [default: 9:16] (choices: "16:9", "9:16", "1:1", "3:4", "4:3", "21:9", "2:3", "3:2")
  --resolution <resolution>            Resolution [default: 1080p] (choices: "1080p", "2K", "4K")
  --input <spec>                       JSON payload: inline string, @file, or - (stdin)
  --dry-run                            Print payload + cost estimate without calling API
  --no-wait                            Return generateId immediately for async tasks
  --timeout <seconds>                  Max seconds to wait for async completion (default: "1800")
  -h, --help                           display help for command
```

## 输出格式

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

## 命令示例

```bash
# 基础调用：
dlazy viduq2-t2i --prompt '提示词内容' --image '/path/to/image.png'

# 复杂调用：
dlazy viduq2-t2i --prompt '提示词内容' --image 'https://oss.dlazy.com/image.png'
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
> 2. 如果执行结果返回 `code: "unauthorized"` 或提示缺少 API Key，您必须明确告知用户前往 [https://dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key) 获取 API Key 并发送给您。当用户提供后，使用 `dlazy auth set <key>` 保存，然后继续执行任务。

## Tips

Visit https://dlazy.com for more information.