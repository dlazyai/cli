---
name: dlazy-banana-pro
version: 1.0.0
description: 使用 Nano Banana Pro 生成/编辑图片，支持文生图与图生图。
metadata:
  {
    'clawdbot': { 'emoji': '🤖', 'requires': { 'bins': ['npm', 'npx'] }, 'install': 'npm install -g @dlazy/cli' },
    'openclaw': { 'systemPrompt': '当调用此技能时，可以使用 dlazy banana-pro -h 查看帮助信息。' },
  }
---

# dlazy-banana-pro

使用 Nano Banana Pro 生成/编辑图片，支持文生图与图生图。

## 触发关键词

- nano banana pro, nano banana
- 生成图片、编辑图片
- 文生图、图生图

## 使用方法

**CRITICAL INSTRUCTION FOR AGENT**:
执行 `dlazy banana-pro` 命令获取结果。

```bash
dlazy banana-pro -h

Options :
  --prompt <prompt>           提示词
  --aspectRatio <aspectRatio> 画面比例（支持：auto, 1:1, 4:3, 3:4, 16:9, 9:16, 21:9）[默认：auto]
  --imageSize <imageSize>     图像尺寸（支持：1K, 2K, 4K）[默认：1K]
  --image <image>             本地图片路径或远程图片 URL
  -h, --help                  显示帮助信息
```

## 输出格式

```json
{
  "ok": true,
  "kind": "urls",
  "data": {
    "urls": ["https://oss.dlazy.com/result.png"]
  }
}
```

## 命令示例

```bash
# 文生图：
dlazy banana-pro --prompt '提示词内容' --image '/path/to/image.png'

# 图生图：
dlazy banana-pro --prompt '提示词内容' --image 'https://oss.dlazy.com/image.png'

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