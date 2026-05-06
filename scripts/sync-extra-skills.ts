import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// These four skills are hand-authored (not generated from `dlazy tools list`)
// and not imported from agent/.../skills, so neither sync-skills.ts nor
// sync-agent-skills.ts touches them. This script keeps their frontmatter
// metadata, language switcher, Authentication, Provenance, How-It-Works,
// Piping and Error Handling sections aligned with the templates used elsewhere.

const TARGETS = [
	"dlazy-audio-generate",
	"dlazy-generate",
	"dlazy-image-generate",
	"dlazy-video-generate",
];

const SKILLS_DIR = path.join(__dirname, "../skills");
const CLI_PATH = path.join(__dirname, "../src/index.ts");
const CLI_PKG_PATH = path.join(__dirname, "../package.json");
const CLI_VERSION: string = JSON.parse(
	fs.readFileSync(CLI_PKG_PATH, "utf8"),
).version;

const langSwitcher = `[English](./SKILL.md) · [中文](./SKILL-cn.md)`;

type SkillLocale = "en-US" | "zh-CN";
type ListedTool = {
	cli_name: string;
	type: string;
	description?: string;
};

function runCmd(args: string, locale: SkillLocale): any {
	const cmd = `npx tsx "${CLI_PATH}" --lang ${locale} ${args}`;
	let out = "";
	try {
		out = execSync(cmd, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "inherit"],
			env: { ...process.env, DLAZY_LANG: locale },
		});
	} catch (e: any) {
		console.error(`Failed to run ${cmd}`);
		if (e.stdout) console.error("stdout:", e.stdout.toString());
		if (e.stderr) console.error("stderr:", e.stderr.toString());
		if (e.message) console.error("error:", e.message);
		return null;
	}
	try {
		return JSON.parse(out);
	} catch (e: any) {
		console.error(`Failed to parse JSON from: ${cmd}`);
		console.error("raw output:", out);
		console.error("parse error:", e.message);
		return null;
	}
}

function unwrapEnvelope(env: any): any | null {
	if (!env || env.ok !== true) return null;
	const outputs = env.result?.outputs;
	if (!Array.isArray(outputs) || outputs.length === 0) return null;
	const first = outputs[0];
	if (first?.type === "json") return first.value;
	return null;
}

function getListedTools(locale: SkillLocale): ListedTool[] {
	const listEnv = runCmd("tools list", locale);
	const listData = unwrapEnvelope(listEnv);
	if (!listData || !Array.isArray(listData.tools)) {
		console.error(`Failed to get tools list for ${locale}.`);
		process.exit(1);
	}
	return listData.tools as ListedTool[];
}

function buildModelLines(tools: ListedTool[]): string {
	return tools
		.map((tool) => `- \`dlazy ${tool.cli_name}\`: ${tool.description ?? ""}`)
		.join("\n");
}

function buildUsageSection(
	skillName: string,
	isCn: boolean,
	tools: ListedTool[],
): string {
	const imageTools = tools.filter((tool) => tool.type === "image");
	const videoTools = tools.filter((tool) => tool.type === "video");
	const audioTools = tools.filter((tool) => tool.type === "audio");

	if (skillName === "dlazy-image-generate") {
		return isCn
			? `## 使用方法

此技能处理所有图片生成请求，通过选择最佳的 \`dlazy\` 图片模型。

### 可用的图片模型

${buildModelLines(imageTools)}

> **智能体关键指令**:
>
> 1. 选择最合适的图片模型。
> 2. 运行 \`dlazy <model_name> -h\` 查看参数。
> 3. 执行命令。`
			: `## Usage

This skill handles all image generation requests by selecting the best \`dlazy\` image model.

### Available Image Models

${buildModelLines(imageTools)}

**CRITICAL INSTRUCTION FOR AGENT**:

1. Select the most appropriate image model.
2. Run \`dlazy <model_name> -h\` to check parameters.
3. Execute the command.`;
	}

	if (skillName === "dlazy-video-generate") {
		return isCn
			? `## 使用方法

此技能处理所有视频生成请求，通过选择最佳的 \`dlazy\` 视频模型。

### 可用的视频模型

${buildModelLines(videoTools)}

> **智能体关键指令**:
>
> 1. 选择最合适的视频模型。
> 2. 运行 \`dlazy <model_name> -h\` 查看参数。
> 3. 执行命令。`
			: `## Usage

This skill handles all video generation requests by selecting the best \`dlazy\` video model.

### Available Video Models

${buildModelLines(videoTools)}

**CRITICAL INSTRUCTION FOR AGENT**:

1. Select the most appropriate video model.
2. Run \`dlazy <model_name> -h\` to check parameters.
3. Execute the command.`;
	}

	if (skillName === "dlazy-audio-generate") {
		return isCn
			? `## 使用方法

此技能处理所有音频生成请求，通过选择最佳的 \`dlazy\` 音频模型。

### 可用的音频模型

${buildModelLines(audioTools)}

> **智能体关键指令**:
>
> 1. 选择最合适的音频模型。
> 2. 运行 \`dlazy <model_name> -h\` 查看参数。
> 3. 执行命令。`
			: `## Usage

This skill handles all audio generation requests by selecting the best \`dlazy\` audio model.

### Available Audio Models

${buildModelLines(audioTools)}

**CRITICAL INSTRUCTION FOR AGENT**:

1. Select the most appropriate audio model.
2. Run \`dlazy <model_name> -h\` to check parameters.
3. Execute the command.`;
	}

	return isCn
		? `## 使用方法

这是一个综合技能，它会根据用户的意图，自动将生成请求路由到合适的 \`dlazy\` 模型。

### 按分类可用的模型

**图片生成 (Image):**

${buildModelLines(imageTools)}

**视频生成 (Video):**

${buildModelLines(videoTools)}

**音频生成 (Audio):**

${buildModelLines(audioTools)}

> **智能体关键指令**:
>
> 1. 确定用户请求的媒体类型（图片、视频或音频）。
> 2. 从上述列表中选择最合适的模型。
> 3. 运行 \`dlazy <model_name> -h\` 查看该特定模型所需的参数。
> 4. 执行命令（例如 \`dlazy seedream-4.5 --prompt "..."\`）。`
		: `## Usage

This is a comprehensive skill that routes generation requests to the appropriate \`dlazy\` model based on the user's intent.

### Available Models by Category

**Image Generation:**

${buildModelLines(imageTools)}

**Video Generation:**

${buildModelLines(videoTools)}

**Audio Generation:**

${buildModelLines(audioTools)}

**CRITICAL INSTRUCTION FOR AGENT**:

1. Determine the media type (image, video, or audio) requested by the user.
2. Select the most appropriate model from the list above.
3. Run \`dlazy <model_name> -h\` to check the required parameters for that specific model.
4. Execute the command (e.g., \`dlazy seedream-4.5 --prompt "..."\`).`;
}

const authBlockEn = `## Authentication

All requests require a dLazy API key. The recommended way to authenticate is:



\`\`\`bash

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

Each key is scoped to your dLazy organization and can be **rotated or revoked at any time** from the same dashboard.`;

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

每个 key 都属于你自己的 dLazy 组织，可在同一控制面板**随时轮换或吊销**。`;

const provenanceBlockEn = `## About & Provenance

- **CLI source code**: [github.com/dlazyai/cli](https://github.com/dlazyai/cli)
- **Maintainer**: dlazyai
- **npm package**: \`@dlazy/cli\` (pinned to \`1.0.9\` in this skill's install spec)
- **Homepage**: [dlazy.com](https://dlazy.com)

You can install on demand without persisting a global binary by running:

\`\`\`bash
npx @dlazy/cli@1.0.9 <command>
\`\`\`

Or, if you prefer a global install, the skill's \`metadata.clawdbot.install\` field declares the exact pinned version (\`npm install -g @dlazy/cli@1.0.9\`). Review the GitHub source before installing.`;

const provenanceBlockCn = `## 关于与来源 (Provenance)

- **CLI 源代码**: [github.com/dlazyai/cli](https://github.com/dlazyai/cli)
- **维护者**: dlazyai
- **npm 包名**: \`@dlazy/cli\`（本技能 install 字段固定到 \`1.0.9\` 版本）
- **官网**: [dlazy.com](https://dlazy.com)

如果你不希望在系统上长期保留一个全局 CLI，可以按需运行：

\`\`\`bash
npx @dlazy/cli@1.0.9 <command>
\`\`\`

如选择全局安装，技能的 \`metadata.clawdbot.install\` 字段已固定到 \`npm install -g @dlazy/cli@1.0.9\`。安装前建议先到 GitHub 仓库审阅源码。`;

const pipingBlockEn = `## Piping Between Commands

Every \`dlazy\` invocation prints a JSON envelope on stdout. Any flag value can be a **pipe reference** that pulls from the upstream command's envelope, so you can chain steps without copying URLs by hand.

| Reference          | Resolves to                                                     |
| ------------------ | --------------------------------------------------------------- |
| \`-\`                | Upstream's natural value for this field (scalar or array)       |
| \`@N\`               | The N-th output's primary value (e.g. \`@0\` = first output url)  |
| \`@N.<jsonpath>\`    | Drill into the N-th output (\`@0.url\`, \`@1.meta.fps\`)            |
| \`@*\`               | All outputs' primary values as an array                         |
| \`@stdin\`           | The whole upstream JSON envelope                                |
| \`@stdin:<jsonpath>\` | Jsonpath into the whole envelope (\`@stdin:result.outputs[0].url\`) |

### Examples

\`\`\`bash
# Generate an image and feed its url straight into image-to-video
dlazy seedream-4.5 --prompt "a red fox in snow" \\
  | dlazy kling-v3 --image - --prompt "fox starts running"

# Generate an image, then add TTS narration over a still
dlazy seedream-4.5 --prompt "lighthouse at dawn" \\
  | dlazy keling-tts --text "Welcome to the coast." --image @0.url

# Fan-out: pass every upstream output url into a batch step
dlazy seedream-4.5 --prompt "city skyline" --n 4 \\
  | dlazy superres --images @*
\`\`\`

> Required flags can be entirely sourced from the pipe — \`--field -\` satisfies the requirement when an upstream value exists. If stdin is empty, the CLI fails with \`code: "no_stdin"\`.`;

const pipingBlockCn = `## 命令间管道 (Piping)

每次 \`dlazy\` 调用都会向 stdout 输出一个 JSON 信封。任意参数都可以使用 **管道引用** 直接从上游命令的信封里取值，避免手工复制 URL。

| 引用语法              | 含义                                                            |
| --------------------- | --------------------------------------------------------------- |
| \`-\`                   | 上游为该字段提供的自然值（标量或数组按字段类型自动选取）        |
| \`@N\`                  | 第 N 个 output 的主值（如 \`@0\` 为第一个 output 的 url）         |
| \`@N.<jsonpath>\`       | 进入第 N 个 output 的字段（\`@0.url\`, \`@1.meta.fps\`）            |
| \`@*\`                  | 所有 output 的主值组成的数组                                    |
| \`@stdin\`              | 上游完整的 JSON 信封                                            |
| \`@stdin:<jsonpath>\`   | 在完整信封上做 jsonpath（\`@stdin:result.outputs[0].url\`）       |

### 示例

\`\`\`bash
# 文生图后直接把图喂给图生视频
dlazy seedream-4.5 --prompt "雪地里的红狐" \\
  | dlazy kling-v3 --image - --prompt "狐狸开始奔跑"

# 文生图 + TTS 配音（拿第一个 output 的 url 作为画面）
dlazy seedream-4.5 --prompt "黎明的灯塔" \\
  | dlazy keling-tts --text "欢迎来到海岸。" --image @0.url

# 批量分发：把上游所有 output 的 url 一次性传给批处理步骤
dlazy seedream-4.5 --prompt "城市天际线" --n 4 \\
  | dlazy superres --images @*
\`\`\`

> 必填参数也可以完全由管道提供 —— 当上游存在对应值时，\`--field -\` 即可满足必填校验。若 stdin 为空，CLI 会以 \`code: "no_stdin"\` 报错。`;

const howItWorksEn = `## How It Works

This skill is a thin client over the dLazy hosted API. When you invoke it:

- Prompts and parameters you provide are sent to the dLazy API endpoint (\`api.dlazy.com\`) for inference.
- Any local file paths you pass to image / video / audio fields are uploaded to dLazy's media storage (\`files.dlazy.com\`) so the model can read them — the same flow as any cloud-based generation API.
- Generated output URLs returned by the API are hosted on \`files.dlazy.com\`.

This is the standard SaaS pattern; the skill itself does not access network or filesystem resources beyond what the dLazy CLI already handles. See [dlazy.com](https://dlazy.com) for the full service terms.`;

const howItWorksCn = `## 工作原理

此技能是 dLazy 托管 API 的轻量封装。调用时：

- 你提供的提示词与参数会发送到 dLazy API（\`api.dlazy.com\`）进行推理。
- 传入图像 / 视频 / 音频字段的本地文件路径会被 CLI 上传到 dLazy 媒体存储（\`files.dlazy.com\`），以便模型读取 —— 与任何云端生成 API 的流程一致。
- API 返回的生成结果 URL 由 \`files.dlazy.com\` 托管。

这是标准的 SaaS 调用模式；技能本身不会越权访问网络或文件系统，所有动作都由 dLazy CLI 完成。完整服务条款请参见 [dlazy.com](https://dlazy.com)。`;

const errTableEn = `## Error Handling

| Code | Error Type                         | Example Message                                                                                                          |
| ---- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 401  | Unauthorized (No API Key)          | \`ok: false, code: "unauthorized", message: "API key is missing or invalid"\`                                                              |
| 501  | Missing required parameter         | \`error: required option '--prompt <prompt>' not specified\`                                                              |
| 502  | Local file read error              | \`Error: Image file/Video file not found: C:\\path\\to\\your\\file\`                                                          |
| 503  | API request failed (no balance)    | \`ok: false, code: "insufficient_balance"\` |
| 503  | API request failed (server error)  | \`HTTP status code error (500 server crash)\`                                                                             |
| 504  | Asynchronous task execution failed | \`=== Generation Failed ===\` / \`{Specific error reason returned by backend, for example "Prompt violates safety policy"}\` |

> **AGENT CRITICAL INSTRUCTION**: 
> 1. If the execution result returns \`code: "insufficient_balance"\`, you MUST explicitly inform the user that their credits are insufficient and guide them to recharge: [https://dlazy.com/dashboard/organization/settings?tab=credits](https://dlazy.com/dashboard/organization/settings?tab=credits)
> 2. If the execution result returns \`code: "unauthorized"\` or indicates missing API key, you MUST inform the user to get their API key from [https://dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key) and save it using \`dlazy auth set <key>\` and resume the task.

## Tips

Visit https://dlazy.com for more information.`;

const errTableCn = `## 错误处理

| Code | 错误类型                         | 示例信息                                                                                                                 |
| ---- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 401  | 未授权 (API Key缺失或无效)       | \`ok: false, code: "unauthorized", message: "API key is missing or invalid"\`                                                              |
| 501  | 缺少必填参数                     | \`error: required option '--prompt <prompt>' not specified\`                                                               |
| 502  | 本地文件读取失败                 | \`Error: Image file/Video file not found: C:\\path\\to\\your\\file\`                                                           |
| 503  | API 请求失败（余额不足）         | \`ok: false, code: "insufficient_balance"\` |
| 503  | API 请求失败（服务端错误）       | \`HTTP status code error (500 server crash)\`                                                                              |
| 504  | 异步任务执行失败                 | \`=== Generation Failed ===\` / \`{后端返回的具体失败原因，比如 "Prompt violates safety policy"}\`                             |

> **智能体关键指令**: 
> 1. 如果执行结果返回 \`code: "insufficient_balance"\` 且提示余额不足（Insufficient balance），您必须明确告知用户当前积分不足，并引导用户点击以下链接前往充值：[https://dlazy.com/dashboard/organization/settings?tab=credits](https://dlazy.com/dashboard/organization/settings?tab=credits)
> 2. 如果执行结果返回 \`code: "unauthorized"\` 或提示缺少 API Key，您必须明确告知用户前往 [https://dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key) 获取 API Key 并使用 \`dlazy auth set <key>\` 保存，然后继续执行任务。

## Tips

Visit https://dlazy.com for more information.`;

function patchFile(
	filePath: string,
	toolsEn: ListedTool[],
	toolsCn: ListedTool[],
) {
	if (!fs.existsSync(filePath)) {
		console.warn(`skip missing: ${filePath}`);
		return;
	}
	const isCn = filePath.endsWith("-cn.md");
	let content = fs.readFileSync(filePath, "utf8");
	const eol = content.includes("\r\n") ? "\r\n" : "\n";
	const skillName = path.basename(path.dirname(filePath));
	const usageSection = buildUsageSection(
		skillName,
		isCn,
		isCn ? toolsCn : toolsEn,
	).replace(/\n/g, eol);

	// 1) Rewrite the entire `metadata:` line to a canonical value so repeated
	//    runs never accumulate duplicate fields. We preserve the existing
	//    openclaw.systemPrompt (which is per-skill) by extracting it first.
	const sysPromptMatch = content.match(
		/"openclaw":\s*\{\s*"systemPrompt":\s*"((?:[^"\\]|\\.)*)"\s*\}/,
	);
	const sysPrompt = sysPromptMatch
		? sysPromptMatch[1]
		: isCn
			? "当调用此技能时，请自动选择对应的 dlazy 子命令执行。"
			: "When this skill is called, use dlazy <subcommand>.";
	const newMetaLine = `metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.9","installAlternative":"npx @dlazy/cli@1.0.9","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","files.dlazy.com"]},"openclaw":{"systemPrompt":"${sysPrompt}"}}`;
	content = content.replace(
		/^metadata:\s*(?:\{[\s\S]*?\}|\n[\s\S]*?)(?=\r?\n---)/m,
		newMetaLine,
	);

	// Bump version in frontmatter to match packages/cli/package.json.
	content = content.replace(/^version:\s*\S+\s*$/m, `version: ${CLI_VERSION}`);

	// Refresh the bilingual switcher to the canonical single line.
	content = content.replace(/^\[English\]\(\.\/SKILL\.md\)[^\n]*\n+/gm, "");
	content = content.replace(
		/^(# [^\n]+\n)/m,
		`$1${eol}${langSwitcher}${eol}${eol}`,
	);

	// 2) Replace the entire Authentication block (handles both old "plaintext"
	//    wording and the new wording — we always rewrite to the latest).
	const authHeaderRe = isCn
		? /## 身份验证 \(Authentication\)[\s\S]*?(?=\r?\n## )/
		: /## Authentication[\s\S]*?(?=\r?\n## )/;
	const newAuth = isCn ? authBlockCn : authBlockEn;
	content = content.replace(authHeaderRe, `${newAuth}\n`);

	// 3) Drop any prior "About & Provenance" / "Data & Privacy" / "How It Works"
	//    / "Piping" blocks so we can re-insert clean ones in the canonical order.
	const sweepHeaders = isCn
		? [
				/## 关于与来源[\s\S]*?(?=\r?\n## )/,
				/## 数据与隐私[\s\S]*?(?=\r?\n## )/,
				/## 工作原理[\s\S]*?(?=\r?\n## )/,
				/## 命令间管道[\s\S]*?(?=\r?\n## )/,
			]
		: [
				/## About & Provenance[\s\S]*?(?=\r?\n## )/,
				/## Data & Privacy[\s\S]*?(?=\r?\n## )/,
				/## How It Works[\s\S]*?(?=\r?\n## )/,
				/## Piping Between Commands[\s\S]*?(?=\r?\n## )/,
			];
	for (const re of sweepHeaders) content = content.replace(re, "");

	// 4) Insert fresh Provenance + How-It-Works + Piping right before the first "## Usage".
	const provenance = isCn ? provenanceBlockCn : provenanceBlockEn;
	const howItWorks = isCn ? howItWorksCn : howItWorksEn;
	const piping = isCn ? pipingBlockCn : pipingBlockEn;
	content = content.replace(
		/(\r?\n## (?:Usage(?: \/ 使用方法)?|使用方法))/,
		`${eol}${provenance}${eol}${eol}${howItWorks}${eol}${eol}${piping}${eol}$1`,
	);

	// 5) Normalise the Chinese auth-error instruction wording.
	content = content.replace(
		/获取 API Key 并发送给您。当用户提供后，使用 `dlazy auth set <key>` (?:保存|设置后)，然后继续执行任务。/g,
		"获取 API Key 并使用 `dlazy auth set <key>` 保存，然后继续执行任务。",
	);
	content = content.replace(
		/获取 API Key 并使用 `dlazy auth set <key>` 设置后，然后继续执行任务。/g,
		"获取 API Key 并使用 `dlazy auth set <key>` 保存，然后继续执行任务。",
	);

	// 6) Refresh the Usage section with the latest models from `tools list`.
	content = content.replace(
		/## (?:Usage(?: \/ 使用方法)?|使用方法)[\s\S]*?(?=\r?\n## (?:Error Handling|错误处理))/,
		`${usageSection}${eol}${eol}`,
	);

	// 7) Refresh the shared Error Handling + Tips block.
	content = content.replace(
		/## (?:Error Handling|错误处理)[\s\S]*/,
		isCn ? errTableCn : errTableEn,
	);

	fs.writeFileSync(filePath, content, "utf8");
	console.log(`patched: ${path.relative(process.cwd(), filePath)}`);
}

function main() {
	const toolsEn = getListedTools("en-US").filter((tool) =>
		["image", "video", "audio"].includes(tool.type),
	);
	const toolsCn = getListedTools("zh-CN").filter((tool) =>
		["image", "video", "audio"].includes(tool.type),
	);

	for (const skillName of TARGETS) {
		for (const file of ["SKILL.md", "SKILL-cn.md"]) {
			patchFile(path.join(SKILLS_DIR, skillName, file), toolsEn, toolsCn);
		}
	}
	console.log("Done patching extra skills!");
}

main();
