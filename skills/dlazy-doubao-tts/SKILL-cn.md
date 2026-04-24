---
name: dlazy-doubao-tts
version: 1.0.3
description: 使用豆包 (Doubao) TTS 文本转语音模型，将文字合成为自然流畅的语音播报。
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.6"},"openclaw":{"systemPrompt":"当调用此技能时，可以使用 dlazy doubao-tts -h 查看帮助信息。"}}
---

# dlazy-doubao-tts

使用豆包 (Doubao) TTS 文本转语音模型，将文字合成为自然流畅的语音播报。

## 触发关键词

- 豆包 tts
- 文本转语音
- 生成语音
- 语音播报

## 身份验证 (Authentication)

所有请求都需要配置 dLazy API key。

**CLI 配置**: 你可以通过以下命令设置你的 API key：

```bash
dlazy auth set YOUR_API_KEY
```

### 获取你的 API Key

1. 登录或在 [dlazy.com](https://dlazy.com) 创建账号
2. 访问 [dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key)
3. 点击 API Key 右侧的复制按钮获取它

## 使用方法

**CRITICAL INSTRUCTION FOR AGENT**: 
执行 `dlazy doubao-tts` 命令获取结果。

```bash
dlazy doubao-tts -h

Options:
  --prompt <prompt>                    Prompt
  --voice_language <voice_language>    Voice Language [default: zh-cn] (choices: "zh-cn", "en")
  --voiceId <voiceId>                  Voice ID [default: zh_female_shuangkuaisisi_uranus_bigtts]
  --speed_ratio <speed_ratio>          Speed Ratio [default: 1.0] (choices: "0.8", "1.0", "1.2", "1.5", "2.0")
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
dlazy doubao-tts --prompt '提示词内容'

# 复杂调用：
dlazy doubao-tts --prompt '提示词内容'
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
> 2. 如果执行结果返回 `code: "unauthorized"` 或提示缺少 API Key，您必须明确告知用户前往 [https://dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key) 获取 API Key 并使用 `dlazy auth set <key>` 设置后，然后继续执行任务。

## Tips

Visit https://dlazy.com for more information.