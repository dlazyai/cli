# For Developers & Agents

This document is intended for AI agents (like OpenClaw, Copilot) or developers who want to understand the internal workings, extension mechanisms, and local development processes of the `@dlazy/cli`.

## 核心特性 (Core Features)

- **动态命令支持**：根据 `modal.config.ts` 动态注册所有模型命令（如 `dlazy seedream-4.5`）。
- **完善的参数提示**：自动从 Zod Schema 提取描述、枚举值、默认值并生成 CLI 的 `--help`。
- **自动认证机制**：支持本地调用浏览器一键授权（`dlazy login`），或直接设置 Token。
- **结构化输出**：自动识别并过滤复杂的后端响应，只在终端输出干净的文本或媒体 URL。
- **同步/异步轮询**：对于耗时较长的生图/视频模型，CLI 会自动获取 Task ID 并轮询状态直至完成。

## 本地环境开发与测试 (Local Development)

如果你在开发或修改了这个 CLI，按照以下步骤即可在本地进行全局测试。

### 1. 编译构建
进入 `packages/cli` 目录并运行构建命令：
```bash
cd packages/cli
pnpm run build
```

### 2. 全局链接 (Link)
构建完成后，通过 `npm link` 将本地的 `dlazy` 命令挂载到你的系统全局环境中：
```bash
npm link --force
```
> *注意：如果你之前遇到过 EEXIST 报错，请务必带上 `--force` 参数强制覆盖旧的快捷方式。*

### 3. 测试运行
现在你可以在终端任意位置测试了：
```bash
# 查看所有支持的模型和帮助信息
dlazy --help

# 登录授权
dlazy login
# 或者手动设置 Key
dlazy auth set sk-xxxxxxx

# 查看当前认证的 API Key
dlazy auth get

# 调用某个具体的模型 (例如生成一张图)
dlazy seedream-4.5 --prompt "一只赛博朋克风格的猫"
```

## 添加或修改模型 (Adding/Modifying Models)

CLI 的所有命令都是**动态读取**工作区根目录的 `config/modal.config.ts` 生成的。
当你需要在 CLI 中增加新的模型或参数时：

1. 打开根目录的 `config/modal.config.ts`。
2. 在 `aiModels` 数组中添加/修改模型配置。
3. 确保包含以下核心字段：
   - `cli_name`: 终端调用的命令名称（建议使用 `.` 代替 `_`，如 `veo-3.1`）。
   - `inputSchema`: 决定了 CLI `--help` 提示的参数。
   - `outputSchema`: 决定了 CLI 最终从后端提取并打印哪些结果内容。
   - `asynchronous`: 标记为 `true` 时 CLI 会自动执行任务轮询。
4. 修改完毕后，回到本目录重新执行 `pnpm run build` 即可生效。

## 技术栈 (Tech Stack)
- [Commander.js](https://github.com/tj/commander.js/) (CLI 框架)
- [Zod](https://zod.dev/) (Schema 验证与内省)
- [tsup](https://tsup.egoist.dev/) (极速打包)
