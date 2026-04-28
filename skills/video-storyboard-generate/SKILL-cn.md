---
name: video-storyboard-generate
version: 1.0.0
description: 1. 获取分镜信息
triggers:
  - 分镜视频生成流程
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.7","installAlternative":"npx @dlazy/cli@1.0.7","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","oss.dlazy.com"]},"openclaw":{"systemPrompt":"当你需要使用此技能时，请严格遵循此技能提供的指南进行规划和执行。你可以通过调用 dlazy CLI 的各类生成模型（如 dlazy seedream-4.5 等）来完成实际的图片渲染。注意：Windows PowerShell 中不允许使用 `&` 或 `&&` 进行命令串联或后台运行，请单独且同步地执行命令。"}}
---

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
- **npm 包名**: `@dlazy/cli`（本技能 install 字段固定到 `1.0.7` 版本）
- **官网**: [dlazy.com](https://dlazy.com)

如果你不希望在系统上长期保留一个全局 CLI，可以按需运行：

```bash
npx @dlazy/cli@1.0.7 <command>
```

如选择全局安装，技能的 `metadata.clawdbot.install` 字段已固定到 `npm install -g @dlazy/cli@1.0.7`。安装前建议先到 GitHub 仓库审阅源码。

## 工作原理 (How It Works)

此技能是 dLazy 托管 API 的轻量封装。调用时：

- 你提供的提示词与参数会发送到 dLazy API（`api.dlazy.com`）进行推理。
- 传入图像 / 视频 / 音频字段的本地文件路径会被 CLI 上传到 dLazy 媒体存储（`oss.dlazy.com`），以便模型读取 —— 与任何云端生成 API 的流程一致。
- API 返回的生成结果 URL 由 `oss.dlazy.com` 托管。

这是标准的 SaaS 调用模式；技能本身不会越权访问网络或文件系统，所有动作都由 dLazy CLI 完成。

---
name: 'video-storyboard-generate'
description: '将一个分镜的内容，转换成一个分镜生成视频的生成流程，用户可以将流程添加到画布中'
---

# 分镜视频生成流程

[English](./SKILL.md) · [中文](./SKILL-cn.md)

1. 获取分镜信息
2. 定义视频的生成流程
3. 画到画布中

## 获取分镜信息

从上下文中获取分镜信息：

- 图片/视频比例：aspect_ratio， 例如：16:9、9:16、4:3、3:4、1:1
- 图片/视频分辨率：resolution，例如：1080p、720p
- 依据比率和分辨率，计算出视频的宽度和高度， width, height

提取分镜列表：

- 分镜名称：story_name1
- 对话文本：dialogue_text1
- 视频生成提示词：video_prompt1

  ## 定义视频的生成流程

  视频生成流程时一段JSON字符串，示例格式如下, 请注意以下问题：
  1. 记得替换{name}中的内容, 注意 x\y\w\h 是数值，替换后需要去掉引号；
  2. 原始声音和场景图是所有分镜共用的,只有一个，克隆声音和视频和分镜数量一致，请循环分镜列表创建。
  3. 元素的位置x和y，按分镜列表的顺序累加，每个分镜之间间隔100像素。

  ```json
  [
    {
      "type": "audio",
      "x": 0,
      "y": 0,
      "props": {
        "name": "原始声音",
        "w": "{width}",
        "h": "{height}"
      }
    },
    {
      "type": "audio",
      "x": "{width + 100}",
      "y": 0,
      "props": {
        "name": "{story_name1} 克隆声音",
        "w": "{width}",
        "h": "{height}",
        "model": "vidu-audio-clone",
        "input": {
          "prompt": "{dialogue_text1}",
          "audio_url": "shape://name:原始声音"
        }
      }
    },
    {
      "type": "image",
      "x": 0,
      "y": "{height + 100}",
      "props": {
        "name": "场景图",
        "w": "{width}",
        "h": "{height}"
      }
    },
    {
      "type": "video",
      "x": "{width + 100}",
      "y": "{height + 100}",
      "props": {
        "name": "{story_name1} 视频",
        "w": "{width}",
        "h": "{height}",
        "model": "jimeng-omnihuman-1_5",
        "input": {
          "audio": ["shape://name:{story_name1} 克隆声音"],
          "images": ["shape://name:场景图"],
          "prompt": "{video_prompt1}",
          "fast_mode": false,
          "resolution": "{resolution}"
        }
      }
    }
  ]
  ```

  ## 画到画布中

  调用 MCP 的 drawToCanvas 工具， 将前面定义的流程添加到画布中。


## 🛠️ 执行与生成指南 (CRITICAL EXECUTION INSTRUCTIONS)

**你是可以执行终端命令的智能 Agent！**

**【严格禁止行为】**
- 严禁：将提示词保存到任何文件中（如 txt, md）。
- 严禁：要求用户自己去第三方平台（如 Midjourney）生成图片。
- 严禁：一次性批量生成所有图片，或一次性执行多个命令。

**【必须遵循的交互与执行流程】**
你必须**严格分步**执行，并在每一步停下来等待用户回复：

1. **第一步：主动收集需求**。当用户提出需求时，不要做任何设计和生成，先向用户提问（如产品特点、目标人群、想要几张图等）。**必须等待用户回答。**
2. **第二步：输出草案并请求确认**。根据用户的回答，制定套图计划，并输出**第一张图**的提示词草案。**询问用户：“是否确认这个提示词，可以开始生成第一张图了吗？” 必须等待用户回答“确认”。**
3. **第三步：单次执行终端命令**。用户确认后，你**必须使用终端执行命令**（如 `dlazy seedream-4.5 --prompt "..."`），每次只能执行一个生成命令。**重要：必须使用同步命令，绝不要在命令末尾加 `&`，绝不要使用 `&&`，这是在 Windows PowerShell 下运行！**
4. **第四步：交付与循环**。命令返回结果后，把图片 URL 发给用户，并询问“对这张满意吗？我们可以继续生成下一张了吗？”。收到确认后再继续下一步。
