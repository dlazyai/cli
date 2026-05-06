/**
 * 将 agent/qwen 与 agent/claude 各自维护的 skills 目录同步到顶层 skills/ 中，
 * 同时插入中英双语切换链接和统一的鉴权说明区块。
 *
 * 执行命令:
 *   pnpm run skills:sync
 *   或: npx tsx scripts/sync-agent-skills.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";

const SOURCE_DIRS = [
	path.join(__dirname, "../../../agent/qwen/.qwen/skills"),
	path.join(__dirname, "../../../agent/claude/.claude/skills"),
];
const TARGET_DIR = path.join(__dirname, "../skills");
const CLI_PKG_PATH = path.join(__dirname, "../package.json");
const CLI_VERSION: string = JSON.parse(
	fs.readFileSync(CLI_PKG_PATH, "utf8"),
).version;

const langSwitcher = `[English](./SKILL.md) · [中文](./SKILL-cn.md)`;

function injectLangSwitcher(body: string): string {
	// Insert (or refresh) the switcher right after the first `# Heading` line.
	return body.replace(
		/^(# [^\n]+\n)(?:\n\[English\]\(\.\/SKILL\.md\)[^\n]*\n)?/m,
		`$1\n${langSwitcher}\n`,
	);
}

const authBlockCn = `## 身份验证 (Authentication)

所有请求都需要 dLazy API key。**推荐使用** \`dlazy login\` 完成登录：

\`\`\`bash
dlazy login
\`\`\`

该命令使用设备码流程（远程终端也可用），登录成功后 **自动把 API key 写入本地 CLI 配置**，无需手动复制粘贴。

### 备选：手动设置 API Key

如果你已有 API key，也可以直接保存：

\`\`\`bash
dlazy auth set YOUR_API_KEY
\`\`\`

CLI 会把 key 保存在你的用户配置目录（macOS/Linux 上为 \`~/.dlazy/config.json\`，Windows 上为 \`%USERPROFILE%\\.dlazy\\config.json\`），文件权限仅限当前操作系统用户访问。你也可以用 \`DLAZY_API_KEY\` 环境变量按次传入。

### 手动获取 API Key

1. 登录或在 [dlazy.com](https://dlazy.com) 创建账号
2. 访问 [dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key)
3. 复制 API Key 区域显示的密钥

每个 key 都属于你自己的 dLazy 组织，可在同一控制面板**随时轮换或吊销**。

## 关于与来源 (Provenance)

- **CLI 源代码**: [github.com/dlazyai/cli](https://github.com/dlazyai/cli)
- **维护者**: dlazyai
- **npm 包名**: \`@dlazy/cli\`（本技能 install 字段固定到 \`1.0.9\` 版本）
- **官网**: [dlazy.com](https://dlazy.com)

如果你不希望在系统上长期保留一个全局 CLI，可以按需运行：

\`\`\`bash
npx @dlazy/cli@1.0.9 <command>
\`\`\`

如选择全局安装，技能的 \`metadata.clawdbot.install\` 字段已固定到 \`npm install -g @dlazy/cli@1.0.9\`。安装前建议先到 GitHub 仓库审阅源码。

## 工作原理 (How It Works)

此技能是 dLazy 托管 API 的轻量封装。调用时：

- 你提供的提示词与参数会发送到 dLazy API（\`api.dlazy.com\`）进行推理。
- 传入图像 / 视频 / 音频字段的本地文件路径会被 CLI 上传到 dLazy 媒体存储（\`files.dlazy.com\`），以便模型读取 —— 与任何云端生成 API 的流程一致。
- API 返回的生成结果 URL 由 \`files.dlazy.com\` 托管。

这是标准的 SaaS 调用模式；技能本身不会越权访问网络或文件系统，所有动作都由 dLazy CLI 完成。

`;

const authBlockEn = `## Authentication

All requests require a dLazy API key. The recommended way to authenticate is:

\`\`\`bash
dlazy login
\`\`\`

This runs a device-code flow (also works in remote shells) and **automatically saves your API key** to the local CLI config — no manual copy/paste required.

### Alternative: Set the Key Manually

If you already have an API key, you can save it directly:

\`\`\`bash
dlazy auth set YOUR_API_KEY
\`\`\`

The CLI saves the key in your user config directory (\`~/.dlazy/config.json\` on macOS/Linux, \`%USERPROFILE%\\.dlazy\\config.json\` on Windows), with file permissions restricted to your OS user account. You can also supply the key per-invocation via the \`DLAZY_API_KEY\` environment variable.

### Getting Your API Key Manually

1. Sign in or create an account at [dlazy.com](https://dlazy.com)
2. Go to [dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key)
3. Copy the key shown in the API Key section

Each key is scoped to your dLazy organization and can be **rotated or revoked at any time** from the same dashboard.

## About & Provenance

- **CLI source code**: [github.com/dlazyai/cli](https://github.com/dlazyai/cli)
- **Maintainer**: dlazyai
- **npm package**: \`@dlazy/cli\` (pinned to \`1.0.9\` in this skill's install spec)
- **Homepage**: [dlazy.com](https://dlazy.com)

You can install on demand without persisting a global binary by running:

\`\`\`bash
npx @dlazy/cli@1.0.9 <command>
\`\`\`

Or, if you prefer a global install, the skill's \`metadata.clawdbot.install\` field declares the exact pinned version (\`npm install -g @dlazy/cli@1.0.9\`). Review the GitHub source before installing.

## How It Works

This skill is a thin client over the dLazy hosted API. When you invoke it:

- Prompts and parameters you provide are sent to the dLazy API endpoint (\`api.dlazy.com\`) for inference.
- Any local file paths you pass to image / video / audio fields are uploaded to dLazy's media storage (\`files.dlazy.com\`) so the model can read them — the same flow as any cloud-based generation API.
- Generated output URLs returned by the API are hosted on \`files.dlazy.com\`.

This is the standard SaaS pattern; the skill itself does not access network or filesystem resources beyond what the dLazy CLI already handles.

`;

function processSkill(sourceDir: string, skillDirName: string) {
	const sourceFilePath = path.join(sourceDir, skillDirName, "SKILL.md");
	if (!fs.existsSync(sourceFilePath)) {
		console.warn(`No SKILL.md found in ${skillDirName}`);
		return;
	}

	let content = fs.readFileSync(sourceFilePath, "utf8");

	// Remove original frontmatter if it exists
	if (content.startsWith("---")) {
		const match = content.match(/^---[\s\S]*?---\n/);
		if (match) {
			content = content.slice(match[0].length);
		}
	}

	// Extract title and description
	// Example:
	// # 亚马逊产品套图
	//
	// 这是一个专为亚马逊电商平台设计的...

	const lines = content.split("\n");
	let title = "";
	let description = "";
	const triggers: string[] = [];
	let inScenarios = false;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (line.startsWith("# ") && !title) {
			title = line.replace("# ", "");
			triggers.push(title);
		} else if (line && !line.startsWith("#") && title && !description) {
			description = line;
		}

		if (
			line.startsWith("## 适用场景") ||
			line.startsWith("适用场景：") ||
			line.startsWith("## Applicable Scenarios") ||
			line.startsWith("Applicable Scenarios:")
		) {
			inScenarios = true;
			continue;
		} else if (
			inScenarios &&
			(line.startsWith("#") || line.endsWith("：") || line.endsWith(":"))
		) {
			inScenarios = false;
		}

		if (inScenarios && line.startsWith("- ")) {
			triggers.push(line.replace("- ", "").trim());
		}
	}

	// Fallback description
	if (!description) {
		description = `${title} 技能`;
	}

	// Remove quotes if any, and truncate to 200 chars
	description = description.replace(/"/g, "'").slice(0, 190);

	const triggersYaml = triggers.map((t) => `  - ${t}`).join("\n");

	const frontmatter = `---
name: ${skillDirName}
version: ${CLI_VERSION}
description: ${description}
triggers:
${triggersYaml}
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.9","installAlternative":"npx @dlazy/cli@1.0.9","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","files.dlazy.com"]},"openclaw":{"systemPrompt":"当你需要使用此技能时，请严格遵循此技能提供的指南进行规划和执行。你可以通过调用 dlazy CLI 的各类生成模型（如 dlazy seedream-4.5 等）来完成实际的图片渲染。注意：Windows PowerShell 中不允许使用 \`&\` 或 \`&&\` 进行命令串联或后台运行，请单独且同步地执行命令。"}}
---

`;

	// remove references to write_todos since it's not supported
	content = content.replace(
		/在开始任何.*前，先调用 `write_todos`.*包含：/g,
		"在开始任何输出前，先建立任务计划，至少包含：",
	);
	content = content.replace(
		/每完成一个阶段，立即更新 `write_todos` 状态。/g,
		"每完成一个阶段，更新计划状态。",
	);
	content = content.replace(/调用 `write_todos` /g, "");
	content = injectLangSwitcher(content);

	const executionGuide = `

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
3. **第三步：单次执行终端命令**。用户确认后，你**必须使用终端执行命令**（如 \`dlazy seedream-4.5 --prompt "..."\`），每次只能执行一个生成命令。**重要：必须使用同步命令，绝不要在命令末尾加 \`&\`，绝不要使用 \`&&\`，这是在 Windows PowerShell 下运行！**
4. **第四步：交付与循环**。命令返回结果后，把图片 URL 发给用户，并询问“对这张满意吗？我们可以继续生成下一张了吗？”。收到确认后再继续下一步。
`;

	const executionGuideEn = `

## 🛠️ CRITICAL EXECUTION INSTRUCTIONS

**You are an intelligent Agent capable of executing terminal commands!**

**[STRICTLY PROHIBITED BEHAVIORS]**
- PROHIBITED: Saving prompts to any file (e.g., txt, md).
- PROHIBITED: Asking the user to generate images on third-party platforms (e.g., Midjourney).
- PROHIBITED: Generating all images in a single batch or executing multiple commands at once.

**[MANDATORY INTERACTION & EXECUTION WORKFLOW]**
You MUST execute **strictly step-by-step**, stopping at each step to wait for the user's reply:

1. **Step 1: Proactively Gather Requirements**. When a user makes a request, DO NOT design or generate anything. Ask questions first (e.g., product features, target audience, number of images). **You MUST wait for the user's reply.**
2. **Step 2: Output Draft & Request Confirmation**. Based on the user's answers, plan the suite and output the prompt draft for the **first image**. **Ask the user: "Do you confirm this prompt? Can we start generating the first image?" You MUST wait for the user to answer "confirm".**
3. **Step 3: Execute Terminal Command (Single)**. After confirmation, you **MUST execute the command using the terminal** (e.g., \`dlazy seedream-4.5 --prompt "..."\`). Execute only ONE generation command at a time. **IMPORTANT: You MUST use synchronous commands. NEVER append \`&\` to the command, and NEVER use \`&&\`. You are running in Windows PowerShell!**
4. **Step 4: Delivery & Loop**. Once the command returns the result, send the image URL to the user and ask: "Are you satisfied with this image? Can we proceed to generate the next one?". Continue to the next step only after receiving confirmation.
`;

	const finalContent = frontmatter + authBlockCn + content + executionGuide;
	let finalContentEn = finalContent; // fallback

	const sourceEnFilePath = path.join(sourceDir, skillDirName, "SKILL-en.md");
	if (fs.existsSync(sourceEnFilePath)) {
		let contentEn = fs.readFileSync(sourceEnFilePath, "utf8");

		// Remove original frontmatter if it exists
		if (contentEn.startsWith("---")) {
			const matchEn = contentEn.match(/^---[\s\S]*?---\n/);
			if (matchEn) {
				contentEn = contentEn.slice(matchEn[0].length);
			}
		}

		const linesEn = contentEn.split("\n");
		let titleEn = "";
		let descriptionEn = "";
		const triggersEn: string[] = [];
		let inScenariosEn = false;

		for (const rawLine of linesEn) {
			const line = rawLine.trim();
			if (line.startsWith("# ") && !titleEn) {
				titleEn = line.replace("# ", "");
				triggersEn.push(titleEn);
			} else if (line && !line.startsWith("#") && titleEn && !descriptionEn) {
				descriptionEn = line;
			}

			if (
				line.startsWith("## 适用场景") ||
				line.startsWith("适用场景：") ||
				line.startsWith("## Applicable Scenarios") ||
				line.startsWith("Applicable Scenarios:")
			) {
				inScenariosEn = true;
				continue;
			} else if (
				inScenariosEn &&
				(line.startsWith("#") || line.endsWith("：") || line.endsWith(":"))
			) {
				inScenariosEn = false;
			}

			if (inScenariosEn && line.startsWith("- ")) {
				triggersEn.push(line.replace("- ", "").trim());
			}
		}

		if (!descriptionEn) {
			descriptionEn = `${titleEn} Skill`;
		}
		descriptionEn = descriptionEn.replace(/"/g, "'").slice(0, 190);

		const triggersYamlEn = triggersEn.map((t) => `  - ${t}`).join("\n");

		const frontmatterEn = `---
name: ${skillDirName}
version: ${CLI_VERSION}
description: ${descriptionEn}
triggers:
${triggersYamlEn}
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.9","installAlternative":"npx @dlazy/cli@1.0.9","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","files.dlazy.com"]},"openclaw":{"systemPrompt":"When you need to use this skill, please strictly follow the guidelines provided by this skill to plan and execute. You can call various generative models of the dlazy CLI (such as dlazy seedream-4.5, etc.) to complete the actual image rendering. Note: Using \`&\` or \`&&\` for command chaining or background execution is not allowed in Windows PowerShell, please execute commands separately and synchronously."}}
---

`;
		contentEn = contentEn.replace(
			/在开始任何.*前，先调用 `write_todos`.*包含：/g,
			"Before starting any output, establish a task plan containing at least:",
		);
		contentEn = contentEn.replace(
			/每完成一个阶段，立即更新 `write_todos` 状态。/g,
			"Update the plan status upon completing each stage.",
		);
		contentEn = contentEn.replace(/调用 `write_todos` /g, "");
		contentEn = injectLangSwitcher(contentEn);

		finalContentEn = frontmatterEn + authBlockEn + contentEn + executionGuideEn;
	}

	const targetSkillDir = path.join(TARGET_DIR, skillDirName);
	if (!fs.existsSync(targetSkillDir)) {
		fs.mkdirSync(targetSkillDir, { recursive: true });
	}

	// SKILL.md IS the English canonical version; no separate SKILL-en.md.
	// finalContentEn falls back to finalContent when the source has no SKILL-en.md.
	fs.writeFileSync(
		path.join(targetSkillDir, "SKILL.md"),
		finalContentEn,
		"utf8",
	);
	fs.writeFileSync(
		path.join(targetSkillDir, "SKILL-cn.md"),
		finalContent,
		"utf8",
	);
	const legacyEn = path.join(targetSkillDir, "SKILL-en.md");
	if (fs.existsSync(legacyEn)) fs.unlinkSync(legacyEn);

	console.log(`Synced skill: ${skillDirName}`);
}

function main() {
	for (const sourceDir of SOURCE_DIRS) {
		if (!fs.existsSync(sourceDir)) {
			console.error(`Source directory not found: ${sourceDir}`);
			continue;
		}

		const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.isDirectory()) {
				processSkill(sourceDir, entry.name);
			}
		}
	}
	console.log("Done syncing agent skills!");
}

main();
