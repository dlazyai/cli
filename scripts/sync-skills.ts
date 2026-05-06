/**
 * 调用 @dlazy/cli 的 tools list 输出，根据每个工具的 schema 生成/更新
 * skills/<tool>/SKILL.md 与 SKILL-cn.md（含 frontmatter、CLI 用法、字段说明等）。
 *
 * 执行命令:
 *   pnpm run skills:sync
 *   或: npx tsx scripts/sync-skills.ts
 */
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const CLI_PATH = path.join(__dirname, "../src/index.ts");
const SKILLS_DIR = path.join(__dirname, "../skills");
const CLI_PKG_PATH = path.join(__dirname, "../package.json");
const CLI_VERSION: string = JSON.parse(
	fs.readFileSync(CLI_PKG_PATH, "utf8"),
).version;

type SkillLocale = "en-US" | "zh-CN";

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

/**
 * The CLI now returns a unified envelope: `{ ok, result: { outputs: [...] } }`.
 * Meta commands (`tools list`, `tools describe`) wrap their payload in a single
 * JSON output via `jsonResult()` — extract that value here.
 */
function unwrapEnvelope(env: any): any | null {
	if (!env || env.ok !== true) return null;
	const outputs = env.result?.outputs;
	if (!Array.isArray(outputs) || outputs.length === 0) return null;
	const first = outputs[0];
	if (first?.type === "json") return first.value;
	return null;
}

function buildOptionHelp(field: any): string {
	// All flags are optional at the parser level; values can flow in via stdin
	// references (`-`, `@N`, `@stdin:...`). Required-ness is enforced after
	// reference resolution, so the help mirrors `[key]` for every flag.
	const argSpec = field.isArray ? `[${field.key}...]` : `[${field.key}]`;
	const line = `  --${field.key} ${argSpec}`.padEnd(39, " ");

	let desc = field.description || "";
	if (field.mediaType) desc += ` [${field.mediaType}: url or local path]`;
	if (field.maxItems) desc += ` (max ${field.maxItems})`;
	if (field.defaultValue !== undefined && field.defaultValue !== null) {
		const d = Array.isArray(field.defaultValue)
			? field.defaultValue.length === 0
				? null
				: JSON.stringify(field.defaultValue)
			: field.defaultValue;
		if (d !== null) desc += ` [default: ${d}]`;
	}
	if (field.dynamicEnum) {
		const parts = Object.entries(field.dynamicEnum.groups).map(
			([groupKey, opts]: [string, any]) => {
				const pairs = (opts as any[])
					.map((o) => `${o.id} (${o.name})`)
					.join(", ");
				return `${field.dynamicEnum.dependsOn}=${groupKey}: ${pairs}`;
			},
		);
		desc += ` [options depend on --${field.dynamicEnum.dependsOn}; ${parts.join("; ")}]`;
	} else if (field.enumChoices) {
		desc += ` (choices: ${field.enumChoices.map((c: any) => `"${c}"`).join(", ")})`;
	}

	if (field.showWhen)
		desc += ` [only when ${describeCondition(field.showWhen)}]`;

	return line + desc;
}

function describeCondition(cond: any): string {
	if (!cond) return "";
	if (cond.all)
		return cond.all.map(describeCondition).filter(Boolean).join(" && ");
	if (cond.any)
		return cond.any.map(describeCondition).filter(Boolean).join(" || ");
	if (cond.not) return `!(${describeCondition(cond.not)})`;
	if (cond.operator === "equals") return `${cond.field}="${cond.value}"`;
	if (cond.operator === "notEquals") return `${cond.field}!="${cond.value}"`;
	if (cond.operator === "empty") return `${cond.field} is empty`;
	if (cond.operator === "notEmpty") return `${cond.field} non-empty`;
	return JSON.stringify(cond);
}

function generateUsageBlock(cliName: string, fields: any[]): string {
	let block = `\`\`\`bash\ndlazy ${cliName} -h\n\nOptions:\n`;
	for (const f of fields) {
		block += `${buildOptionHelp(f)}\n`;
	}
	block += `  --dry-run                            Print payload + cost estimate without calling API
  --no-wait                            Return generateId immediately for async tasks
  --timeout <seconds>                  Max seconds to wait for async completion (default: "1800")
  -h, --help                           display help for command\n\`\`\`

> Any flag also accepts pipe references — \`-\` (auto-pick from upstream stdin), \`@N\` (n-th output), \`@N.path\` (jsonpath into output), \`@*\` (all primary values), \`@stdin\` / \`@stdin:path\` (whole envelope). See \`dlazy --help\` for details.`;
	return block;
}

function generateOutputBlock(
	toolName: string,
	modelId: string,
	output: any,
): string {
	const kind = output?.kind ?? "raw";
	let outputSample: string;
	if (kind === "urls") {
		outputSample = `{
        "type": "image",
        "id": "o_xxxxxxxx",
        "url": "https://files.dlazy.com/result.png",
        "mimeType": "image/png"
      }`;
	} else if (kind === "text") {
		outputSample = `{
        "type": "text",
        "id": "o_xxxxxxxx",
        "text": "..."
      }`;
	} else if (kind === "shapes") {
		outputSample = `{
        "type": "shape",
        "id": "o_xxxxxxxx",
        "shape": {}
      }`;
	} else {
		outputSample = `{
        "type": "json",
        "id": "o_xxxxxxxx",
        "value": {}
      }`;
	}
	return `\`\`\`json
{
  "ok": true,
  "result": {
    "tool": "${toolName}",
    "modelId": "${modelId}",
    "outputs": [
      ${outputSample}
    ]
  }
}
\`\`\`

> Async tasks (when \`--no-wait\` is passed) return \`outputs: []\` and a \`task: { generateId, status }\` field instead. Use \`dlazy status <generateId> --wait\` to poll.`;
}

const langSwitcher = `[English](./SKILL.md) · [中文](./SKILL-cn.md)`;

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

const dataFlowBlockEn = `## How It Works

This skill is a thin client over the dLazy hosted API. When you invoke it:

- Prompts and parameters you provide are sent to the dLazy API endpoint (\`api.dlazy.com\`) for inference.
- Any local file paths you pass to image / video / audio fields are uploaded to dLazy's media storage (\`files.dlazy.com\`) so the model can read them — the same flow as any cloud-based generation API.
- Generated output URLs returned by the API are hosted on \`files.dlazy.com\`.

This is the standard SaaS pattern; the skill itself does not access network or filesystem resources beyond what the dLazy CLI already handles. See [dlazy.com](https://dlazy.com) for the full service terms.`;

const dataFlowBlockCn = `## 工作原理

此技能是 dLazy 托管 API 的轻量封装。调用时：

- 你提供的提示词与参数会发送到 dLazy API（\`api.dlazy.com\`）进行推理。
- 传入图像 / 视频 / 音频字段的本地文件路径会被 CLI 上传到 dLazy 媒体存储（\`files.dlazy.com\`），以便模型读取 —— 与任何云端生成 API 的流程一致。
- API 返回的生成结果 URL 由 \`files.dlazy.com\` 托管。

这是标准的 SaaS 调用模式；技能本身不会越权访问网络或文件系统，所有动作都由 dLazy CLI 完成。完整服务条款请参见 [dlazy.com](https://dlazy.com)。`;

function getTemplate(
	cliName: string,
	desc: string,
	usageBlock: string,
	outputBlock: string,
	isCn: boolean,
): string {
	const enText = `---
name: dlazy-${cliName}
version: ${CLI_VERSION}
description: ${desc}
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.9","installAlternative":"npx @dlazy/cli@1.0.9","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","files.dlazy.com"]},"openclaw":{"systemPrompt":"When invoking this skill, use dlazy ${cliName} -h for help."}}
---

# dlazy-${cliName}

${langSwitcher}

${desc}

## Trigger Keywords

- ${cliName}

${authBlockEn}

${provenanceBlockEn}

${dataFlowBlockEn}

## Usage

**CRITICAL INSTRUCTION FOR AGENT**:
Execute \`dlazy ${cliName}\` to get the result.

${usageBlock}

## Output Format

${outputBlock}

## Examples

\`\`\`bash
dlazy ${cliName} --prompt 'prompt content'
\`\`\`

## Error Handling

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

Visit https://dlazy.com for more information.
`;

	const cnText = `---
name: dlazy-${cliName}
version: ${CLI_VERSION}
description: ${desc}
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.9","installAlternative":"npx @dlazy/cli@1.0.9","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","files.dlazy.com"]},"openclaw":{"systemPrompt":"当调用此技能时，可以使用 dlazy ${cliName} -h 查看帮助信息。"}}
---

# dlazy-${cliName}

${langSwitcher}

${desc}

## 触发关键词

- ${cliName}

${authBlockCn}

${provenanceBlockCn}

${dataFlowBlockCn}

## 使用方法

**CRITICAL INSTRUCTION FOR AGENT**:
执行 \`dlazy ${cliName}\` 命令获取结果。

${usageBlock}

## 输出格式

${outputBlock}

## 命令示例

\`\`\`bash
dlazy ${cliName} --prompt '提示词内容'
\`\`\`

## 错误处理

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
> 2. 如果执行结果返回 \`code: "unauthorized"\` 或提示缺少 API Key，您必须明确告知用户前往 [https://dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key) 获取 API Key 并使用 \`dlazy auth set <key>\` 设置后，然后继续执行任务。

## Tips

Visit https://dlazy.com for more information.
`;
	return isCn ? cnText : enText;
}

function updateFile(
	filePath: string,
	cliName: string,
	usageBlock: string,
	outputBlock: string,
) {
	let content = fs.readFileSync(filePath, "utf8");

	const isCn = filePath.endsWith("-cn.md");
	const authBlock = isCn ? authBlockCn : authBlockEn;
	const provenanceBlock = isCn ? provenanceBlockCn : provenanceBlockEn;
	const dataFlowBlock = isCn ? dataFlowBlockCn : dataFlowBlockEn;

	// Refresh metadata field in frontmatter so existing skills get the new provenance/configPath/etc.
	const sysPrompt = isCn
		? `当调用此技能时，可以使用 dlazy ${cliName} -h 查看帮助信息。`
		: `When invoking this skill, use dlazy ${cliName} -h for help.`;
	const newMetadata = `metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.9","installAlternative":"npx @dlazy/cli@1.0.9","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","files.dlazy.com"]},"openclaw":{"systemPrompt":"${sysPrompt}"}}`;
	content = content.replace(/^metadata:\s*\{[\s\S]*?\}\s*$/m, newMetadata);

	// Bump version in frontmatter to match packages/cli/package.json.
	content = content.replace(/^version:\s*\S+\s*$/m, `version: ${CLI_VERSION}`);

	// Strip ALL existing language switcher lines (handles duplicates from prior runs).
	content = content.replace(/^\[English\]\(\.\/SKILL\.md\)[^\n]*\n+/gm, "");
	// Insert one fresh switcher right under the title heading.
	content = content.replace(/^(# dlazy-[^\n]+\n)/m, `$1\n${langSwitcher}\n\n`);

	// Replace Trigger Keywords and insert Auth block
	const triggerRegex =
		/## (Trigger Keywords|触发关键词)\n([\s\S]*?)(?=## (Usage|使用方法|Authentication|身份验证))/;
	content = content.replace(triggerRegex, (_match, p1, p2) => {
		const triggers = p2
			.split("\n")
			.filter((line: string) => line.trim().startsWith("- "))
			.join("\n");
		return `## ${p1}\n\n${triggers}\n\n`;
	});

	// If it already had the auth/provenance/data blocks inserted by a previous run, strip them.
	content = content.replace(
		/(?:## Authentication[\s\S]*?|## 身份验证 \(Authentication\)[\s\S]*?)(?=## (?:Usage|使用方法|About & Provenance|关于与来源))/g,
		"",
	);
	content = content.replace(
		/(?:## About & Provenance[\s\S]*?|## 关于与来源[\s\S]*?)(?=## (?:Usage|使用方法|Data & Privacy|数据与隐私|How It Works|工作原理))/g,
		"",
	);
	content = content.replace(
		/(?:## Data & Privacy[\s\S]*?|## 数据与隐私[\s\S]*?|## How It Works[\s\S]*?|## 工作原理[\s\S]*?)(?=## (?:Usage|使用方法))/g,
		"",
	);

	// Now insert the fresh auth + provenance + data blocks right before Usage
	content = content.replace(
		/## (Usage|使用方法)/,
		`${authBlock}\n\n${provenanceBlock}\n\n${dataFlowBlock}\n\n## $1`,
	);

	// Replace the Usage code block PLUS any inline tip blockquotes that follow
	// it, up to the next `## ` heading. The new usageBlock ends with a `>` tip;
	// matching to the next heading keeps repeated runs from accumulating tips.
	content = content.replace(
		/```bash\n(?:dlazy|npx @dlazy\/cli(?:@\S+)?) [\w.-]+ -h\n[\s\S]*?(?=\n## )/,
		() => `${usageBlock}\n`,
	);

	// Replace Output format section (everything from the heading up to the next
	// heading). Matching the whole section keeps repeated runs idempotent even
	// when the block now includes a trailing blockquote tip after the fence.
	content = content.replace(
		/## (Output Format|输出格式)\n[\s\S]*?(?=\n## )/,
		`## $1\n\n${outputBlock}\n`,
	);

	// Strip any legacy "Displaying Results / 结果展示" block; we no longer emit it.
	content = content.replace(
		/\n## (?:Displaying Results[^\n]*|结果展示[^\n]*)\n[\s\S]*?(?=\n## (?:Examples|Command Examples|命令示例|Error Handling|错误处理))/g,
		"\n",
	);

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

	// Replace Error format block
	content = content.replace(
		/## (Error Handling|错误处理)[\s\S]*/,
		isCn ? errTableCn : errTableEn,
	);

	fs.writeFileSync(filePath, content, "utf8");
}

async function main() {
	if (!fs.existsSync(SKILLS_DIR)) {
		fs.mkdirSync(SKILLS_DIR, { recursive: true });
	}

	console.log("Fetching tools list (en-US) ...");
	const listEnvEn = runCmd("tools list", "en-US");
	const listDataEn = unwrapEnvelope(listEnvEn);
	if (!listDataEn || !Array.isArray(listDataEn.tools)) {
		console.error("Failed to get tools list.");
		process.exit(1);
	}

	const tools = listDataEn.tools;

	for (const tool of tools) {
		const cliName = tool.cli_name;
		console.log(`Processing tool: ${cliName}`);

		const descEnvEn = runCmd(`tools describe ${cliName}`, "en-US");
		const toolDataEn = unwrapEnvelope(descEnvEn);
		const descEnvCn = runCmd(`tools describe ${cliName}`, "zh-CN");
		const toolDataCn = unwrapEnvelope(descEnvCn);
		if (!toolDataEn || !toolDataCn) continue;

		const usageBlockEn = generateUsageBlock(cliName, toolDataEn.input.fields);
		const outputBlockEn = generateOutputBlock(
			cliName,
			toolDataEn.id,
			toolDataEn.output,
		);
		const usageBlockCn = generateUsageBlock(cliName, toolDataCn.input.fields);
		const outputBlockCn = generateOutputBlock(
			cliName,
			toolDataCn.id,
			toolDataCn.output,
		);

		const dirPath = path.join(SKILLS_DIR, `dlazy-${cliName}`);
		if (!fs.existsSync(dirPath)) {
			console.log(`Creating new skill: ${cliName}`);
			fs.mkdirSync(dirPath, { recursive: true });

			const descEn = toolDataEn.description || `dlazy ${cliName} skill`;
			const descCn = toolDataCn.description || `dlazy ${cliName} skill`;
			const enContent = getTemplate(
				cliName,
				descEn,
				usageBlockEn,
				outputBlockEn,
				false,
			);
			const cnContent = getTemplate(
				cliName,
				descCn,
				usageBlockCn,
				outputBlockCn,
				true,
			);

			// SKILL.md IS the English source-of-truth; no separate SKILL-en.md.
			fs.writeFileSync(path.join(dirPath, "SKILL.md"), enContent);
			fs.writeFileSync(path.join(dirPath, "SKILL-cn.md"), cnContent);
		} else {
			console.log(`Updating existing skill: ${cliName}`);
			const enFile = path.join(dirPath, "SKILL.md");
			if (fs.existsSync(enFile)) {
				updateFile(enFile, cliName, usageBlockEn, outputBlockEn);
			}
			const cnFile = path.join(dirPath, "SKILL-cn.md");
			if (fs.existsSync(cnFile)) {
				updateFile(cnFile, cliName, usageBlockCn, outputBlockCn);
			}
			// SKILL.md is now the canonical English version; drop stale SKILL-en.md.
			const legacyEn = path.join(dirPath, "SKILL-en.md");
			if (fs.existsSync(legacyEn)) fs.unlinkSync(legacyEn);
		}
	}

	console.log("Done syncing skills!");
}

main();
