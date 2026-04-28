import type { Messages } from "./types";

export const messages: Messages = {
	cli: {
		description:
			"AI tool runner. Emits JSON envelopes on stdout; logs on stderr.",
		apiKeyOption: "API key (overrides DLAZY_API_KEY and config)",
		baseUrlOption: "API base URL (overrides DLAZY_BASE_URL)",
		verboseOption: "Enable debug logging on stderr",
		langOption: "Output language (en-US or zh-CN)",
	},
	auth: {
		description: "Manage authentication configuration",
		setDescription: "Set your DLAZY_API_KEY manually",
		getDescription: "Get the currently configured DLAZY_API_KEY",
		loginDescription: "Log in via device-code flow (works on remote shells)",
		localOption: "Use localhost:3000 for local testing",
		loginSuccess: "login successful; api key saved to config",
		logoutDescription: "Log out (remove API key from config)",
		logoutSuccess: "logout successful; api key removed from config",
		logoutNothing: "no api key in config; nothing to remove",
		logoutEnvWarning:
			"note: DLAZY_API_KEY env var is still set. Unset it to fully log out.",
		notConfigured: "API key is not set",
		noApiKey:
			"No API key available. Pass --api-key, set DLAZY_API_KEY, or run `dlazy login` in an interactive shell.",
		noApiKeyExit:
			"No API key. Set DLAZY_API_KEY, pass --api-key, or run `dlazy login` in an interactive shell.",
	},
	tools: {
		namespaceDescription: "Discover available AI tools",
		listDescription: "List all tools exposed by the CLI",
		describeDescription: "Emit full metadata + JSON schema for a single tool",
		toolNotFound: (name) => `no tool with cli_name '${name}'`,
		statusDescription: "Query or wait on an async task by generateId",
		statusWaitOption: "Poll until completion",
		statusTimeoutOption: "Max seconds to wait (with --wait)",
		statusToolOption: "Use this tool's outputSchema for typed result parsing",
		runInputOption: "JSON payload: inline string, @file, or - (stdin)",
		runDryRunOption: "Print payload + cost estimate without calling API",
		runNoWaitOption: "Return generateId immediately for async tasks",
		runTimeoutOption: "Max seconds to wait for async completion",
		inputValidationFailed: "input validation failed",
		estimatedCost: (credits) => `estimated cost: ${credits} credits`,
		estimatedDuration: (seconds) => `estimated duration: ${seconds}s`,
	},
	input: {
		inputFileNotFound: (p) => `--input file not found: ${p}`,
		invalidJson: (err) => `--input is not valid JSON: ${err}`,
		inputMustBeObject: "--input must be a JSON object",
		fileNotFound: (label, p) => `${label}: file not found: ${p}`,
		fileTooLarge: (label, sizeMb, limitMb) =>
			`${label}: file is ${sizeMb} MB, exceeds ${limitMb} MB upload limit.`,
		fileSizeWarn: (label, sizeMb) =>
			`[warn] ${label}: file is ${sizeMb} MB; upload may take a while.`,
		uploadFailed: (label, reason) =>
			`${label}: failed to upload to object storage: ${reason}`,
	},
	api: {
		invoking: (modelId) => `invoking ${modelId}`,
		taskSubmitted: (generateId) =>
			`task submitted; waiting for task ${generateId} to finish`,
		requestFailed: (status) => `request failed with status ${status}`,
		statusFetchFailed: (status) => `status fetch failed (${status})`,
		pollFailed: (status) => `poll failed (${status})`,
		taskDidNotComplete: (seconds) => `task did not complete within ${seconds}s`,
		playVideo: (label) => `[▶ Play video${label}]`,
		playAudio: (label) => `[🔊 Play audio${label}]`,
		viewDownload: (label) => `[View / Download${label}]`,
		shapesGenerated: (count) => `✅ Generated ${count} canvas element(s)`,
		taskSubmittedDisplay: (generateId, status) =>
			`⏳ Task submitted (ID: \`${generateId}\`, status: ${status}). Run \`dlazy status ${generateId} --wait\` to poll for results.`,
		generationCompleted: "=== Generation Completed ===",
		displayBannerStart: "----- BEGIN USER-VISIBLE OUTPUT -----",
		displayBannerEnd: "----- END USER-VISIBLE OUTPUT -----",
		displayHint:
			"[instruction] Copy the block between the BEGIN/END markers above into your reply to the user.",
	},
	config: {
		startingAuth: "\n[dLazy CLI] Starting authentication process...",
		visitToAuthorize: (url) =>
			`Open this URL in any browser to authorize:\n${url}\n`,
		pollingNotice: (minutes) =>
			`Waiting for authorization (expires in ${minutes} minute${minutes === 1 ? "" : "s"})...`,
		authExpired: "Authorization request expired or was rejected",
		authTimeout: (minutes) =>
			`Authorization not completed within ${minutes} minute${minutes === 1 ? "" : "s"}`,
	},
};
