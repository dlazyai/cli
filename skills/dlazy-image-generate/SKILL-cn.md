---
name: dlazy-image-generate
version: 1.0.0
description: 图片生成技能。根据提示词自动选择最佳的 dlazy CLI 图片生成模型。
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"当调用此技能时，请自动选择对应的 dlazy 子命令执行。"}}
---

# dlazy-image-generate

图片生成技能。根据提示词自动选择最佳的 dlazy CLI 图片生成模型。

## Trigger Keywords / 触发关键词

- 生成图片
- 画图
- 文生图

## Usage / 使用方法

此技能处理所有图片生成请求，通过选择最佳的 `dlazy` 图片模型。

### 可用的图片模型
- `dlazy seedream-4.5`: 高质量写实/海报。
- `dlazy seedream-5.0-lite`: 快速、低成本草图。
- `dlazy banana2`, `dlazy banana-pro`: 通用文生图。
- `dlazy grok-4.2`: 极简文生图。
- `dlazy recraft-v3`: 风格化（插画等）。
- `dlazy recraft-v3-svg`: SVG/矢量图。
- `dlazy mj.imagine`: Midjourney 风格。
- `dlazy kling-image-o1`, `dlazy viduq2-t2i`, `dlazy jimeng-t2i`: 高保真图片生成。

> **智能体关键指令**: 
1. 选择最合适的图片模型。
2. 运行 \`dlazy <model_name> -h\` 查看参数。
3. 执行命令。

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