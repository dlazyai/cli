// Hand-curated examples that appear in the public docs (scripts/sync-docs.ts).
//
// `samples.test.ts` re-executes each sample's `argv` against a stubbed API
// and asserts the resulting outcome matches `expected*`. `sync-docs.ts`
// imports `findSample` and inlines `command` into the generated docs, so
// the tests are the contract: a doc string only ships after the CLI
// accepts the args and produces the asserted output.
//
// Mocked tool outputs are *copied* from real e2e runs recorded under
// `tests/files/result/e2e/<tool>.json`. We do not import those files at
// test time because that directory is wiped between integration runs.
//
// Categorization:
//   - tool-call : `dlazy <tool> ...` → mocks /api/cli/tool POST, asserts
//                 outputs[].type/url against the recorded shape.
//   - builtin   : `dlazy --help|--version|tools list|tools describe ...` —
//                 no tool POST; manifest is stubbed by runCli.
//   - auth      : `dlazy login|logout|auth set|auth get [--show]` — local
//                 fs-only; the test stubs config to keep tests hermetic.
//   - status-error : `dlazy status <bogus-id>` — mocks the GET to 4xx.

export type ApiMockOutput =
	| { kind: "media-urls"; urls: string[] }
	| { kind: "json"; value: unknown }
	| { kind: "text"; text: string };

type SampleBase = {
	/** Stable id; sync-docs uses this to locate the sample for injection. */
	id: string;
	/**
	 * The exact shell command line as it should appear in the docs. May
	 * include trailing shell glue (` | jq ...`, `> file`, `2> debug.log`)
	 * — set `hasShellGlue: true` when so.
	 */
	command: string;
	/**
	 * argv that re-creates the dlazy invocation embedded in `command`
	 * (everything after the leading `dlazy` / `npx @dlazy/cli@latest`).
	 * Tokenized from `command` and asserted to match exactly when
	 * `hasShellGlue` is false; when true the test only checks the prefix.
	 */
	argv: string[];
	/** True when `command` contains a pipe / redirect after the dlazy call. */
	hasShellGlue?: boolean;
	/** "dlazy" (default) or "npx" for `npx @dlazy/cli@latest <argv>` form. */
	invocation?: "dlazy" | "npx";
};

export type ToolCallSample = SampleBase & {
	kind: "tool-call";
	apiOutput: ApiMockOutput;
	expectedExitCode: number;
	expectedOutputs: Array<{
		type: "image" | "video" | "audio" | "file" | "text" | "json";
		url?: string;
	}>;
};

export type BuiltinSample = SampleBase & {
	kind: "builtin";
	expectedExitCode: number;
	/**
	 * When the CLI emits a JSON envelope: subset assertion on
	 * `payload.result.outputs[0].value`.
	 */
	expectedFirstValueIncludes?: Record<string, unknown>;
	/** Asserts `payload.result.outputs[0].value[<key>]` is a non-empty array. */
	expectedFirstValueHasArray?: string;
	/** When `--help` / `--version` produce non-JSON stdout: substring assert. */
	expectedStdoutIncludes?: string;
};

export type AuthSample = SampleBase & {
	kind: "auth";
	expectedExitCode: number;
	/** Pre-set config (simulating a previous `auth set`). */
	preExistingConfig?: Record<string, string>;
	/** Pre-set DLAZY_API_KEY env var; cleared after the test. */
	preExistingEnv?: string;
	/** Subset assertion on payload.result.outputs[0].value. */
	expectedFirstValueIncludes?: Record<string, unknown>;
	/** When the command should fail: payload.code. */
	expectedErrorCode?: string;
};

export type StatusErrorSample = SampleBase & {
	kind: "status-error";
	/** HTTP status the mocked GET /api/cli/tool?generateId returns. */
	httpStatus: number;
	expectedExitCode: number;
	/** payload.code asserted on failure. */
	expectedErrorCode: string;
};

export type DocSample =
	| ToolCallSample
	| BuiltinSample
	| AuthSample
	| StatusErrorSample;

// Source URLs distilled from tests/files/result/e2e/<tool>.json (recorded
// 2026-04-30). Re-record by running the integration suite and updating.
const URL_GPT_IMAGE_2 =
	"https://files.dlazy.com/data/ai/3df21cf6-c9c0-4ff0-aeec-1b4bde6241ae.jpg";

export const docSamples: DocSample[] = [
	// =====================================================================
	// Tool-call samples
	// =====================================================================
	{
		id: "overview-quickstart-en",
		kind: "tool-call",
		command: 'dlazy gpt-image-2 --prompt "a cyberpunk cat in neon rain"',
		argv: ["gpt-image-2", "--prompt", "a cyberpunk cat in neon rain"],
		apiOutput: { kind: "media-urls", urls: [URL_GPT_IMAGE_2] },
		expectedExitCode: 0,
		expectedOutputs: [{ type: "image", url: URL_GPT_IMAGE_2 }],
	},
	{
		id: "overview-quickstart-zh",
		kind: "tool-call",
		command: 'dlazy gpt-image-2 --prompt "霓虹雨夜里的赛博朋克猫"',
		argv: ["gpt-image-2", "--prompt", "霓虹雨夜里的赛博朋克猫"],
		apiOutput: { kind: "media-urls", urls: [URL_GPT_IMAGE_2] },
		expectedExitCode: 0,
		expectedOutputs: [{ type: "image", url: URL_GPT_IMAGE_2 }],
	},
	{
		id: "installation-oneshot-en",
		kind: "tool-call",
		invocation: "npx",
		command:
			'npx @dlazy/cli@latest gpt-image-2 --prompt "a watercolor of a tea house"',
		argv: ["gpt-image-2", "--prompt", "a watercolor of a tea house"],
		apiOutput: { kind: "media-urls", urls: [URL_GPT_IMAGE_2] },
		expectedExitCode: 0,
		expectedOutputs: [{ type: "image", url: URL_GPT_IMAGE_2 }],
	},
	{
		id: "installation-oneshot-zh",
		kind: "tool-call",
		invocation: "npx",
		command: 'npx @dlazy/cli@latest gpt-image-2 --prompt "茶馆水彩画"',
		argv: ["gpt-image-2", "--prompt", "茶馆水彩画"],
		apiOutput: { kind: "media-urls", urls: [URL_GPT_IMAGE_2] },
		expectedExitCode: 0,
		expectedOutputs: [{ type: "image", url: URL_GPT_IMAGE_2 }],
	},
	{
		id: "cli-quickref-tool-en",
		kind: "tool-call",
		command: 'dlazy gpt-image-2 --prompt "a foggy mountain at dawn"',
		argv: ["gpt-image-2", "--prompt", "a foggy mountain at dawn"],
		apiOutput: { kind: "media-urls", urls: [URL_GPT_IMAGE_2] },
		expectedExitCode: 0,
		expectedOutputs: [{ type: "image", url: URL_GPT_IMAGE_2 }],
	},
	{
		id: "cli-quickref-tool-zh",
		kind: "tool-call",
		command: 'dlazy gpt-image-2 --prompt "黎明时分的山雾"',
		argv: ["gpt-image-2", "--prompt", "黎明时分的山雾"],
		apiOutput: { kind: "media-urls", urls: [URL_GPT_IMAGE_2] },
		expectedExitCode: 0,
		expectedOutputs: [{ type: "image", url: URL_GPT_IMAGE_2 }],
	},
	{
		id: "cli-pipelines-jq-en",
		kind: "tool-call",
		command:
			'dlazy gpt-image-2 --prompt "logo" | jq -r ".result.outputs[0].url"',
		argv: ["gpt-image-2", "--prompt", "logo"],
		hasShellGlue: true,
		apiOutput: { kind: "media-urls", urls: [URL_GPT_IMAGE_2] },
		expectedExitCode: 0,
		expectedOutputs: [{ type: "image", url: URL_GPT_IMAGE_2 }],
	},
	{
		id: "cli-pipelines-jq-zh",
		kind: "tool-call",
		command:
			'dlazy gpt-image-2 --prompt "logo" | jq -r ".result.outputs[0].url"',
		argv: ["gpt-image-2", "--prompt", "logo"],
		hasShellGlue: true,
		apiOutput: { kind: "media-urls", urls: [URL_GPT_IMAGE_2] },
		expectedExitCode: 0,
		expectedOutputs: [{ type: "image", url: URL_GPT_IMAGE_2 }],
	},
	{
		id: "cli-async-batch-en",
		kind: "tool-call",
		command: 'dlazy gpt-image-2 --prompt "rainy-night cyberpunk cat" --batch 4',
		argv: [
			"gpt-image-2",
			"--prompt",
			"rainy-night cyberpunk cat",
			"--batch",
			"4",
		],
		apiOutput: { kind: "media-urls", urls: [URL_GPT_IMAGE_2] },
		expectedExitCode: 0,
		// --batch fans out to 4 parallel runs; each contributes 1 url, so
		// the merged ToolResult has 4 outputs (deduped by id).
		expectedOutputs: [
			{ type: "image", url: URL_GPT_IMAGE_2 },
			{ type: "image", url: URL_GPT_IMAGE_2 },
			{ type: "image", url: URL_GPT_IMAGE_2 },
			{ type: "image", url: URL_GPT_IMAGE_2 },
		],
	},
	{
		id: "cli-async-batch-zh",
		kind: "tool-call",
		command: 'dlazy gpt-image-2 --prompt "雨夜霓虹猫" --batch 4',
		argv: ["gpt-image-2", "--prompt", "雨夜霓虹猫", "--batch", "4"],
		apiOutput: { kind: "media-urls", urls: [URL_GPT_IMAGE_2] },
		expectedExitCode: 0,
		expectedOutputs: [
			{ type: "image", url: URL_GPT_IMAGE_2 },
			{ type: "image", url: URL_GPT_IMAGE_2 },
			{ type: "image", url: URL_GPT_IMAGE_2 },
			{ type: "image", url: URL_GPT_IMAGE_2 },
		],
	},

	// =====================================================================
	// Builtin samples (auth/tools/help/version) — manifest stub only
	// =====================================================================
	{
		id: "builtin-help",
		kind: "builtin",
		command: "dlazy --help",
		argv: ["--help"],
		// commander throws CommanderError(outputHelp) under exitOverride;
		// the test only verifies the flag is accepted, not exit code.
		expectedExitCode: 0,
	},
	{
		id: "builtin-version",
		kind: "builtin",
		command: "dlazy --version",
		argv: ["--version"],
		expectedExitCode: 0,
	},
	{
		id: "builtin-npx-help",
		kind: "builtin",
		invocation: "npx",
		command: "npx @dlazy/cli@latest --help",
		argv: ["--help"],
		expectedExitCode: 0,
	},
	{
		id: "builtin-tools-list",
		kind: "builtin",
		command: "dlazy tools list",
		argv: ["tools", "list"],
		expectedExitCode: 0,
		// `tools list` surfaces the manifest as `value.tools[]`. Asserting
		// the array exists is enough — its length depends on the manifest.
		expectedFirstValueHasArray: "tools",
	},
	{
		id: "builtin-tools-describe-gpt-image-2",
		kind: "builtin",
		command: "dlazy tools describe gpt-image-2",
		argv: ["tools", "describe", "gpt-image-2"],
		expectedExitCode: 0,
		expectedFirstValueIncludes: { cli_name: "gpt-image-2", id: "gpt-image-2" },
	},
	{
		id: "builtin-base-url-tools-list",
		kind: "builtin",
		command: "dlazy --base-url http://localhost:3000 tools list",
		argv: ["--base-url", "http://localhost:3000", "tools", "list"],
		expectedExitCode: 0,
		expectedFirstValueHasArray: "tools",
	},

	// CLI quick-ref block (cli/index page) — padded to align trailing
	// comments. The comment is dropped by shellTokenize before assertion.
	{
		id: "cli-quickref-help-en",
		kind: "builtin",
		command: "dlazy --help                     # global usage",
		argv: ["--help"],
		expectedExitCode: 0,
	},
	{
		id: "cli-quickref-help-zh",
		kind: "builtin",
		command: "dlazy --help                     # 全局帮助",
		argv: ["--help"],
		expectedExitCode: 0,
	},
	{
		id: "cli-quickref-version-en",
		kind: "builtin",
		command: "dlazy --version                  # CLI version",
		argv: ["--version"],
		expectedExitCode: 0,
	},
	{
		id: "cli-quickref-version-zh",
		kind: "builtin",
		command: "dlazy --version                  # CLI 版本",
		argv: ["--version"],
		expectedExitCode: 0,
	},
	{
		id: "cli-quickref-tools-list-en",
		kind: "builtin",
		command: "dlazy tools list                 # registry overview",
		argv: ["tools", "list"],
		expectedExitCode: 0,
		expectedFirstValueHasArray: "tools",
	},
	{
		id: "cli-quickref-tools-list-zh",
		kind: "builtin",
		command: "dlazy tools list                 # 工具清单",
		argv: ["tools", "list"],
		expectedExitCode: 0,
		expectedFirstValueHasArray: "tools",
	},
	{
		id: "cli-quickref-tools-describe-en",
		kind: "builtin",
		command:
			"dlazy tools describe gpt-image-2 # full input + output JSON Schema",
		argv: ["tools", "describe", "gpt-image-2"],
		expectedExitCode: 0,
		expectedFirstValueIncludes: { cli_name: "gpt-image-2", id: "gpt-image-2" },
	},
	{
		id: "cli-quickref-tools-describe-zh",
		kind: "builtin",
		command: "dlazy tools describe gpt-image-2 # 完整输入 + 输出 JSON Schema",
		argv: ["tools", "describe", "gpt-image-2"],
		expectedExitCode: 0,
		expectedFirstValueIncludes: { cli_name: "gpt-image-2", id: "gpt-image-2" },
	},

	{
		id: "globalflags-locale-help-en",
		kind: "builtin",
		// `dlazy -l zh-CN gpt-image-2 --help` — `--help` propagates through
		// commander's exitOverride as CommanderError; we just verify args.
		command: "dlazy -l zh-CN gpt-image-2 --help",
		argv: ["-l", "zh-CN", "gpt-image-2", "--help"],
		expectedExitCode: 0,
	},
	{
		id: "globalflags-locale-help-zh",
		kind: "builtin",
		command: "dlazy -l zh-CN gpt-image-2 --help",
		argv: ["-l", "zh-CN", "gpt-image-2", "--help"],
		expectedExitCode: 0,
	},

	// =====================================================================
	// Auth samples — config stubs (handled by samples.test.ts beforeEach)
	// =====================================================================
	{
		id: "auth-login",
		kind: "auth",
		command: "dlazy login",
		argv: ["login"],
		expectedExitCode: 1,
		// `login` without a stub starts the device-code flow which requires
		// a browser; in tests we expect the bare command to fail loudly
		// rather than asserting on the success path (auth.test.ts covers
		// the success path with a stubbed waitForApiKeyAuth). What matters
		// here is that the command parses.
		expectedErrorCode: "login_failed",
	},
	{
		id: "auth-login-local-en",
		kind: "auth",
		command:
			"dlazy login --local        # device-code against http://localhost:3000",
		argv: ["login", "--local"],
		expectedExitCode: 1,
		expectedErrorCode: "login_failed",
	},
	{
		id: "auth-login-local-zh",
		kind: "auth",
		command: "dlazy login --local        # 走 http://localhost:3000",
		argv: ["login", "--local"],
		expectedExitCode: 1,
		expectedErrorCode: "login_failed",
	},
	{
		id: "auth-set",
		kind: "auth",
		command: "dlazy auth set sk-xxxx",
		argv: ["auth", "set", "sk-xxxx"],
		expectedExitCode: 0,
		expectedFirstValueIncludes: { source: "config", saved: true },
	},
	{
		id: "auth-get-masked-en",
		kind: "auth",
		command: "dlazy auth get             # masked: sk-***1234",
		argv: ["auth", "get"],
		preExistingConfig: { DLAZY_API_KEY: "sk-1234567890abcdef" },
		expectedExitCode: 0,
		expectedFirstValueIncludes: { source: "config" },
	},
	{
		id: "auth-get-masked-zh",
		kind: "auth",
		command: "dlazy auth get             # 默认遮蔽：sk-***1234",
		argv: ["auth", "get"],
		preExistingConfig: { DLAZY_API_KEY: "sk-1234567890abcdef" },
		expectedExitCode: 0,
		expectedFirstValueIncludes: { source: "config" },
	},
	{
		id: "auth-get-show-en",
		kind: "auth",
		command: "dlazy auth get --show      # full key",
		argv: ["auth", "get", "--show"],
		preExistingConfig: { DLAZY_API_KEY: "sk-1234567890abcdef" },
		expectedExitCode: 0,
		expectedFirstValueIncludes: {
			source: "config",
			apiKey: "sk-1234567890abcdef",
		},
	},
	{
		id: "auth-get-show-zh",
		kind: "auth",
		command: "dlazy auth get --show      # 完整 Key",
		argv: ["auth", "get", "--show"],
		preExistingConfig: { DLAZY_API_KEY: "sk-1234567890abcdef" },
		expectedExitCode: 0,
		expectedFirstValueIncludes: {
			source: "config",
			apiKey: "sk-1234567890abcdef",
		},
	},
	{
		id: "auth-logout",
		kind: "auth",
		command: "dlazy logout",
		argv: ["logout"],
		preExistingConfig: { DLAZY_API_KEY: "sk-1234567890abcdef" },
		expectedExitCode: 0,
		expectedFirstValueIncludes: { removed: true },
	},
	{
		id: "auth-get-not-configured",
		kind: "auth",
		command: "dlazy auth get",
		argv: ["auth", "get"],
		expectedExitCode: 1,
		expectedErrorCode: "not_configured",
	},

	// =====================================================================
	// Status-error sample — bogus generateId surfaces http_error
	// =====================================================================
	{
		id: "status-bogus",
		kind: "status-error",
		command: "dlazy status gen_abc123",
		argv: ["status", "gen_abc123"],
		httpStatus: 404,
		expectedExitCode: 1,
		expectedErrorCode: "http_error",
	},
	{
		id: "status-wait-veo",
		kind: "status-error",
		command: "dlazy status gen_abc123 --wait --tool veo-3.1",
		argv: ["status", "gen_abc123", "--wait", "--tool", "veo-3.1"],
		httpStatus: 404,
		expectedExitCode: 1,
		expectedErrorCode: "http_error",
	},
];

// Type guard helpers consumed by samples.test.ts.
export function findSample(id: string): DocSample {
	const match = docSamples.find((s) => s.id === id);
	if (!match) {
		throw new Error(
			`docSample not found: ${id}. Available: ${docSamples.map((s) => s.id).join(", ")}`,
		);
	}
	return match;
}
