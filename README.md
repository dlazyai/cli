# @dlazy/cli

[English](#english) | [中文](#中文)

---

## English

Visit https://dlazy.com for more information.
A powerful and easy-to-use Command-Line Interface (CLI) tool for the dLazy AI workflow. It allows you to directly invoke various state-of-the-art AI models (text-to-image, video generation, text-to-speech, etc.) right from your terminal.

### Quick Start

**1. Install globally via npm:**
```bash
npm install -g @dlazy/cli
```

**2. Authenticate:**
```bash
dlazy login
```

**3. Generate your first AI content!**
```bash
dlazy seedream-4.5 --prompt "A cyberpunk cat in a futuristic city"
```

### Supported Models & Commands

| Command | Type | Description |
|---|---|---|
| `dlazy seedream-4.5` | Image | High-quality text-to-image/image-to-image model (Doubao Seedream 4.5). |
| `dlazy seedream-5.0-lite` | Image | Lightweight high-speed image generation model. |
| `dlazy banana2` | Image | General text-to-image model (Gemini 3.1 Banana 2), emphasizes speed. |
| `dlazy banana-pro` | Image | High-quality text-to-image model for product shots and key visuals. |
| `dlazy grok-4.2` | Image | Minimalist text-to-image model for quick creative validation. |
| `dlazy recraft-v3` | Image | Stylized text-to-image model, supports aspect ratio and style control. |
| `dlazy recraft-v3-svg` | Image | Text-to-vector model, outputs scalable SVG results (Logo/Icons). |
| `dlazy mj.imagine` | Image | Midjourney style generation. |
| `dlazy veo-3.1` | Video | High-quality video generation model (text-to-video & image-driven). |
| `dlazy veo-3.1-fast` | Video | Fast video generation model. |
| `dlazy sora-2` | Video | General high-quality video generation model. |
| `dlazy sora-2-pro` | Video | Enhanced high-quality video model for complex scenes. |
| `dlazy kling-image-o1` | Image | Kling image model, supports multi-image constraints. |
| `dlazy kling-v3` | Video | Kling V3 general video model (text + up to 4 reference images). |
| `dlazy kling-v3-omni` | Video | Kling Omni video model (highly controlled video synthesis). |
| `dlazy seedance-1.5-pro` | Video | ByteDance high-quality video generation model. |
| `dlazy wan2.6-r2v` | Video | Tongyi Wanxiang video generation model (Standard). |
| `dlazy wan2.6-r2v-flash` | Video | Tongyi Wanxiang video generation model (Flash, fast batch). |
| `dlazy wan2.7` | Video | Tongyi Wanxiang 2.7 video model (text/image/frames to video). |
| `dlazy pixverse-c1` | Video | PixVerse C1 video model (strong on action and VFX). |
| `dlazy viduq2-t2i` | Image | Vidu image generation model. |
| `dlazy viduq2-i2v` | Video | Vidu image-to-video model. |
| `dlazy jimeng-t2i` | Image | Jimeng high-res text-to-image model. |
| `dlazy jimeng-i2v-first` | Video | Jimeng first-frame-to-video model. |
| `dlazy jimeng-i2v-first-tail` | Video | Jimeng first/last-frame video model for precise transitions. |
| `dlazy jimeng-dream-actor` | Video | Jimeng character/action-driven video model. |
| `dlazy jimeng-omnihuman-1.5` | Video | Jimeng digital human model (generate video from portrait + audio). |
| `dlazy gemini-2.5-tts` | Audio | Gemini 2.5 Pro Preview TTS. |
| `dlazy suno.music` | Audio | Suno music generation model (supports inspiration & custom modes). |
| `dlazy keling-sfx` | Audio | Sound effect generation model (foley, ambient sounds). |
| `dlazy keling-tts` | Audio | Text-to-speech model (TTS) for dubbing and broadcasts. |
| `dlazy doubao-tts` | Audio | ByteDance Doubao speech synthesis model (streaming audio). |
| `dlazy vidu-audio-clone` | Audio | Clone a real human voice and read specified text. |
| `dlazy kling-audio-clone` | Audio | Custom voice (Kling) clone for dubbing or subject binding. |
| `dlazy superres` | Tool | Super resolve an image (Upscale/Enhance). |
| `dlazy imageseg` | Tool | Segment foreground and background of an image (Remove background). |
| `dlazy merge` | Tool | Merge multiple videos and audios into a single video. |

---

## 中文

访问 https://dlazy.com 获取更多信息.
dLazy AI 工作流的官方命令行工具。让你能够在终端（Terminal）里直接调用当前最先进的各种大语言模型和生成式 AI（涵盖文生图、视频生成、声音克隆、语音合成等）。

### 快速开始

**1. 全局安装:**
```bash
npm install -g @dlazy/cli
```

**2. 登录授权:**
```bash
dlazy login
```

**3. 开始你的第一次 AI 生成!**
```bash
dlazy seedream-4.5 --prompt "一只赛博朋克风格的猫"
```

### 支持的模型与指令列表

| 命令行指令 | 类型 | 说明 |
|---|---|---|
| `dlazy seedream-4.5` | 图片 | 豆包 Seedream 4.5 高质量文生图/参考图生图模型。 |
| `dlazy seedream-5.0-lite` | 图片 | 豆包 Seedream 5.0 轻量高速图像生成模型。 |
| `dlazy banana2` | 图片 | 通用文生图模型，强调速度与性价比。 |
| `dlazy banana-pro` | 图片 | 高质量文生图模型，适合细节要求更高的产品图与品牌风格图。 |
| `dlazy grok-4.2` | 图片 | 极简文生图模型，仅需 prompt，适合快速验证创意。 |
| `dlazy recraft-v3` | 图片 | 风格化文生图模型，支持比例与风格控制（写实/插画等）。 |
| `dlazy recraft-v3-svg` | 图片 | 文本到矢量图模型，输出 SVG 格式，适合 Logo 与图标生成。 |
| `dlazy mj.imagine` | 图片 | Midjourney 风格出图入口。 |
| `dlazy veo-3.1` | 视频 | 高质量视频生成模型，支持文本生视频与单图驱动。 |
| `dlazy veo-3.1-fast` | 视频 | 快速版视频生成模型。 |
| `dlazy sora-2` | 视频 | Sora 2 高质量视频生成模型。 |
| `dlazy sora-2-pro` | 视频 | Sora 2 Pro 增强版高质量视频模型。 |
| `dlazy kling-image-o1` | 图片 | 可灵图像模型，支持占位符强绑定参考图。 |
| `dlazy kling-v3` | 视频 | 可灵 V3 通用视频模型（支持文本+最多4张参考图）。 |
| `dlazy kling-v3-omni` | 视频 | 可灵 Omni 视频模型，支持高难度视频合成与控制。 |
| `dlazy seedance-1.5-pro` | 视频 | 字节跳动高质量视频生成模型。 |
| `dlazy wan2.6-r2v` | 视频 | 通义万相视频生成模型 (标准版)。 |
| `dlazy wan2.6-r2v-flash` | 视频 | 通义万相视频生成模型 (Flash极速版)。 |
| `dlazy wan2.7` | 视频 | 通义万相 2.7 视频模型 (支持文生、图生、首尾帧生视频)。 |
| `dlazy pixverse-c1` | 视频 | PixVerse C1 视频模型 (擅长动作与特效场景)。 |
| `dlazy viduq2-t2i` | 图片 | Vidu 图像生成模型。 |
| `dlazy viduq2-i2v` | 视频 | Vidu 图生视频模型。 |
| `dlazy jimeng-t2i` | 图片 | 即梦高清文生图模型。 |
| `dlazy jimeng-i2v-first` | 视频 | 即梦首帧生视频模型。 |
| `dlazy jimeng-i2v-first-tail` | 视频 | 即梦首尾帧视频模型，精准控制运镜起止状态。 |
| `dlazy jimeng-dream-actor` | 视频 | 即梦角色/动作驱动视频模型。 |
| `dlazy jimeng-omnihuman-1.5` | 视频 | 即梦数字人模型（单图+音频生成数字人播报）。 |
| `dlazy gemini-2.5-tts` | 音频 | Gemini 2.5 Pro 语音合成。 |
| `dlazy suno.music` | 音频 | Suno 音乐生成模型（支持灵感模式与自定义歌词模式）。 |
| `dlazy keling-sfx` | 音频 | 可灵音效生成模型（支持生成环境音、拟音）。 |
| `dlazy keling-tts` | 音频 | 可灵语音合成模型。 |
| `dlazy doubao-tts` | 音频 | 字节跳动豆包语音合成模型（支持流式输出）。 |
| `dlazy vidu-audio-clone` | 音频 | Vidu 真实人声克隆。 |
| `dlazy kling-audio-clone` | 音频 | 可灵自定义音色复刻与配音。 |
| `dlazy superres` | 工具 | 图片超分辨率放大工具。 |
| `dlazy imageseg` | 工具 | 图像抠图工具（去除背景）。 |
| `dlazy merge` | 工具 | 音视频合并工具（将多个视频与音频合成一个文件）。 |
