import { Command } from "commander";
import { vi } from "vitest";
import { z } from "zod";
import { getAiModels } from "../../../../config/modal.config";
import { registerAuthCommands } from "../../src/commands/auth";
import { registerToolCommands } from "../../src/commands/tools";
import { setOutputMode, setVerbose } from "../../src/lib/envelope";
import { _resetStdinCache, _setStdinCache } from "../../src/lib/stdin";
import { setLocale } from "../../src/messages";

const SKIPPED_CLI_NAMES = new Set<string>(["qwen3.6-plus"]);

function buildLocalManifest() {
	const tools = Object.entries(getAiModels())
		.filter(([, cfg]) => cfg.cli_name && !SKIPPED_CLI_NAMES.has(cfg.cli_name))
		.map(([id, cfg]) => ({
			id,
			cli_name: cfg.cli_name,
			type: cfg.type,
			description: cfg.description,
			runMode: cfg.runMode,
			asynchronous: Boolean(cfg.asynchronous),
			tier: cfg.tier ?? null,
			hasCosts: typeof cfg.costs === "function",
			hasDurationEstimation: typeof cfg.durationEstimation === "function",
			inputJsonSchema: (() => {
				try {
					return z.toJSONSchema(cfg.inputSchema as z.ZodType);
				} catch {
					return null;
				}
			})(),
			outputJsonSchema: cfg.outputSchema
				? (() => {
						try {
							return z.toJSONSchema(cfg.outputSchema as z.ZodType);
						} catch {
							return null;
						}
					})()
				: null,
		}));
	return { locale: "en-US" as const, tools };
}

// Stable reference to the truly-native fetch, captured at module load time
// before any spy ever runs. Falling back to this (instead of whatever
// `globalThis.fetch` happens to be when stubManifestFetch runs) prevents
// recursive spy chains across tests when a previous test left a spy in a
// state that vi.spyOn could re-wrap.
const NATIVE_FETCH: typeof fetch = globalThis.fetch.bind(globalThis);

function stubManifestFetch() {
	const manifest = buildLocalManifest();
	const fallback = globalThis.fetch; // whatever the test set up (e.g. fetchMock)
	const stub = (async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === "string" ? input : input.toString();
		if (url.includes("/api/cli/tool/manifest")) {
			return new Response(JSON.stringify(manifest), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}
		// Prefer the test's stub over the real network. If neither exists,
		// fall back to the native fetch (will hit the network).
		return (fallback ?? NATIVE_FETCH)(input as RequestInfo, init);
	}) as typeof fetch;
	const previous = globalThis.fetch;
	globalThis.fetch = stub;
	return {
		mockRestore() {
			globalThis.fetch = previous;
		},
	};
}

export class CliExit extends Error {
	constructor(public exitCode: number) {
		super(`__cli_exit_${exitCode}__`);
	}
}

export type CliResult = {
	stdout: string;
	stderr: string;
	exitCode: number;
	payload: any;
};

export type RunCliOptions = {
	/** Raw piped stdin string (parsed as JSON when valid). */
	stdin?: string;
	/**
	 * When true, skip the local manifest stub so the CLI fetches the real
	 * manifest from the running server. Used by integration tests.
	 */
	liveManifest?: boolean;
};

export async function runCli(
	args: string[],
	options: RunCliOptions = {},
): Promise<CliResult> {
	setLocale("en-US");
	setVerbose(false);
	setOutputMode("json");
	_resetStdinCache();
	if (options.stdin !== undefined) {
		const raw = options.stdin.trim();
		let parsed: unknown = raw;
		try {
			parsed = JSON.parse(raw);
		} catch {
			/* keep raw */
		}
		_setStdinCache({ raw, parsed });
	}

	const stdoutChunks: string[] = [];
	const stderrChunks: string[] = [];
	let firstExitCode: number | null = null;
	let firstExitStdout: string | null = null;

	const writeStdout = vi.spyOn(process.stdout, "write").mockImplementation(((
		chunk: string | Uint8Array,
	) => {
		stdoutChunks.push(
			typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"),
		);
		return true;
	}) as typeof process.stdout.write);

	const writeStderr = vi.spyOn(process.stderr, "write").mockImplementation(((
		chunk: string | Uint8Array,
	) => {
		stderrChunks.push(
			typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"),
		);
		return true;
	}) as typeof process.stderr.write);

	// `success()` and `failure()` both call process.exit. If a caller wraps
	// success() in a try/catch (the login action does), our thrown sentinel
	// gets caught and is re-emitted as a failure — masking the first exit.
	// Capture the first exit code + stdout snapshot so callers see the original
	// envelope, not the secondary one produced by the catch handler.
	const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
		code?: number,
	) => {
		if (firstExitCode === null) {
			firstExitCode = code ?? 0;
			firstExitStdout = stdoutChunks.join("");
		}
		throw new CliExit(code ?? 0);
	}) as typeof process.exit);

	const program = new Command();
	program
		.name("dlazy")
		.exitOverride()
		.option("--api-key <key>")
		.option("--base-url <url>")
		.option("--verbose")
		.option("--output <mode>", undefined, (v) => {
			setOutputMode(v as "json" | "url" | "text");
			return v;
		})
		.option("-l, --lang <locale>");

	const fetchSpy = options.liveManifest ? null : stubManifestFetch();

	registerAuthCommands(program);
	await registerToolCommands(program);

	let lastExitCode = 0;
	try {
		await program.parseAsync(["node", "dlazy", ...args]);
	} catch (err) {
		if (err instanceof CliExit) {
			lastExitCode = err.exitCode;
		} else {
			writeStdout.mockRestore();
			writeStderr.mockRestore();
			exitSpy.mockRestore();
			throw err;
		}
	}

	writeStdout.mockRestore();
	writeStderr.mockRestore();
	exitSpy.mockRestore();
	fetchSpy?.mockRestore();

	const stdout = firstExitStdout ?? stdoutChunks.join("");
	const stderr = stderrChunks.join("");
	const exitCode = firstExitCode ?? lastExitCode;
	let payload: any = null;
	try {
		payload = JSON.parse(stdout);
	} catch {
		// non-JSON output (e.g. help text); leave as null
	}

	return { stdout, stderr, exitCode, payload };
}

/**
 * Helper for tests that produced a single JsonOutput envelope (meta
 * commands, dry-run, auth). Returns the output's `value` field.
 */
export function jsonValue(payload: any): unknown {
	return payload?.result?.outputs?.[0]?.value;
}

/** First media output's url (image/video/audio/file). */
export function firstUrl(payload: any): string | undefined {
	const outputs = payload?.result?.outputs;
	if (!Array.isArray(outputs)) return undefined;
	for (const o of outputs) {
		if (typeof o?.url === "string") return o.url;
	}
	return undefined;
}

/** All media urls in output order. */
export function allUrls(payload: any): string[] {
	const outputs = payload?.result?.outputs;
	if (!Array.isArray(outputs)) return [];
	return outputs
		.map((o) => (typeof o?.url === "string" ? o.url : undefined))
		.filter((u): u is string => typeof u === "string");
}
