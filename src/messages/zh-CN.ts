import type { Messages } from "./types";

export const messages: Messages = {
	cli: {
		description: "AI 工具运行器。标准输出返回 JSON 信封，日志写入标准错误。",
		apiKeyOption: "API 密钥（优先级高于 DLAZY_API_KEY 和配置文件）",
		baseUrlOption: "API 地址（优先级高于 DLAZY_BASE_URL）",
		verboseOption: "在标准错误中输出调试日志",
		langOption: "输出语言（en-US 或 zh-CN）",
	},
	auth: {
		description: "管理认证配置",
		setDescription: "手动设置 DLAZY_API_KEY",
		getDescription: "查看当前配置的 DLAZY_API_KEY(默认遮蔽)",
		getShowOption: "完整显示 API 密钥,不进行遮蔽",
		loginDescription: "通过设备码流程登录（支持远程终端）",
		localOption: "使用 localhost:3000 进行本地测试",
		loginSuccess: "登录成功;API 密钥已保存到配置文件",
		logoutDescription: "退出登录(从配置文件中清除 API 密钥)",
		logoutSuccess: "已退出登录;API 密钥已从配置文件中清除",
		logoutNothing: "配置文件中没有 API 密钥,无需清除",
		logoutEnvWarning:
			"提示:环境变量 DLAZY_API_KEY 仍然生效。如需完全退出,请同时清除该环境变量。",
		notConfigured: "尚未设置 API 密钥",
		noApiKey:
			"未找到可用的 API 密钥。请传入 --api-key、设置 DLAZY_API_KEY,或在交互式终端运行 `dlazy login`。",
	},
	tools: {
		namespaceDescription: "浏览可用的 AI 工具",
		listDescription: "列出 CLI 支持的所有工具",
		describeDescription: "输出单个工具的完整元信息与 JSON Schema",
		toolNotFound: (name) => `未找到 cli_name 为 '${name}' 的工具`,
		statusDescription: "通过 generateId 查询或等待异步任务",
		statusWaitOption: "轮询直到任务完成",
		statusTimeoutOption: "最大等待秒数（配合 --wait 使用）",
		statusToolOption: "使用该工具的 outputSchema 解析结果类型",
		runDryRunOption: "仅打印载荷和费用预估,不实际调用 API",
		runNoWaitOption: "异步任务立即返回 generateId,不等待完成",
		runTimeoutOption: "异步任务等待的最大秒数",
		runBatchOption: "并行执行 N 次,所有 outputs 合并到同一信封(默认 1)",
		runInputOption: "内联 JSON 或 @path/to/file.json,与 flag 值合并(flag 优先)",
		inputValidationFailed: "输入参数校验失败",
		inputFileNotFound: (p) => `--input 文件不存在:${p}`,
		inputFileBadJson: (p, reason) => `--input ${p}:JSON 解析失败(${reason})`,
		flagJsonParseFailed: (key, reason) =>
			`--${key} 每个值必须是 JSON 对象（${reason}）`,
		estimatedCost: (credits) => `预估费用:${credits} 积分`,
		estimatedDuration: (seconds) => `预估耗时:${seconds} 秒`,
		outputHeader: "输出 (stdout JSON 信封):",
		outputEnvelope:
			"  { ok: true, result: { tool, modelId, outputs[], usage?, task? } }",
		outputErrorEnvelope:
			"  失败时: { ok: false, code, message, details? } (退出码 1 或 2)",
		outputUrlsKind: (mediaType) =>
			`  outputs[]: { type: "${mediaType}", id, url, mimeType?, bytes?, width?, height?, durationMs?, thumbnailUrl? }`,
		outputTextKind:
			'  outputs[]: { type: "text", id, text, format?: "plain"|"markdown"|"json"|"srt"|"vtt" }',
		outputRawKind:
			'  outputs[]: { type: "json", id, value: <详见下方 Output schema> }',
		outputAsyncNote:
			"  异步工具:配合 --no-wait 时,outputs=[] 且 result.task = { generateId, status }",
		outputSchemaHeader: "Output schema (信封包装前的原始 provider 数据):",
		outputSchemaEmpty: "  (该工具未声明 output schema)",
		outputListHeader: "输出:",
		outputListShape:
			'  result.outputs[0] = { type: "json", value: { tools: [{ cli_name, id, type, runMode, asynchronous, tier, description }] } }',
		outputDescribeHeader: "输出:",
		outputDescribeShape:
			'  result.outputs[0] = { type: "json", value: { cli_name, id, type, description, runMode, asynchronous, tier, input: { fields[], jsonSchema }, output: { kind, jsonSchema } | null } }',
		outputStatusHeader:
			'输出:与工具运行的信封一致;传 --tool <cli_name> 后使用该工具的 outputSchema 解析 outputs[](否则 outputs[].type="json")。',
	},
	input: {
		fileNotFound: (label, p) => `${label}:文件不存在:${p}`,
		fileTooLarge: (label, sizeMb, limitMb) =>
			`${label}:文件大小 ${sizeMb} MB,超过 ${limitMb} MB 上传上限。`,
		fileSizeWarn: (label, sizeMb) =>
			`[警告] ${label}:文件大小 ${sizeMb} MB;上传可能耗时较长。`,
		uploadFailed: (label, reason) => `${label}:上传到对象存储失败:${reason}`,
	},
	api: {
		invoking: (modelId) => `正在调用 ${modelId}`,
		taskSubmitted: (generateId) =>
			`任务已提交;正在等待任务 ${generateId} 运行结束`,
		requestFailed: (status) => `请求失败,状态码 ${status}`,
		statusFetchFailed: (status) => `获取状态失败(${status})`,
		pollFailed: (status) => `轮询失败(${status})`,
		taskDidNotComplete: (seconds) => `任务在 ${seconds} 秒内未完成`,
		playVideo: (label) => `[▶ 点击播放视频${label}]`,
		playAudio: (label) => `[🔊 点击播放音频${label}]`,
		viewDownload: (label) => `[查看/下载${label}]`,
		taskSubmittedDisplay: (generateId, status) =>
			`⏳ 任务已提交(ID: \`${generateId}\`,状态: ${status})。可运行 \`dlazy status ${generateId} --wait\` 轮询结果。`,
		generationCompleted: "=== 生成完成 ===",
		displayBannerStart: "----- 用户可见输出 开始 -----",
		displayBannerEnd: "----- 用户可见输出 结束 -----",
		displayHint:
			"[指令] 请将上方 开始/结束 标记之间的内容,输出到用户的回复里。",
		versionTooLow: (current, min, upgradeCommand) =>
			`CLI 版本 ${current} 过低（最低要求 ${min}）。请运行 \`${upgradeCommand}\` 升级后重试。`,
	},
	config: {
		startingAuth: "\n[dLazy CLI] 正在启动登录流程...",
		visitToAuthorize: (url) =>
			`请在任意浏览器中打开以下链接完成授权。如果您已确认完成授权，您可以继续后续操作：\n${url}\n`,
		pollingNotice: (minutes) => `等待授权完成（${minutes} 分钟内有效）...`,
		authExpired: "授权请求已过期或被拒绝",
		authTimeout: (minutes) => `${minutes} 分钟内未完成授权`,
	},
};
