import { t } from "../messages";
import type { Output, ToolResult } from "./output";

export type OkEnvelope = {
	ok: true;
	result: ToolResult;
};

export type ErrEnvelope = {
	ok: false;
	code: string;
	message: string;
	details?: unknown;
};

export type Envelope = OkEnvelope | ErrEnvelope;

export class SdkError extends Error {
	constructor(
		public code: string,
		message: string,
		public details?: unknown,
		public exitCode: 1 | 2 = 1,
	) {
		super(message);
		this.name = "SdkError";
	}
}

let verbose = false;

export function setVerbose(v: boolean) {
	verbose = v;
}

// ---------------------------------------------------------------------------
// Output mode — controls what success() writes to stdout. Default `json`
// emits the full envelope; the others are pipe-friendly compactions.
// ---------------------------------------------------------------------------

export type OutputMode = "json" | "url" | "text";
let outputMode: OutputMode = "json";

export function setOutputMode(m: OutputMode): void {
	outputMode = m;
}

export function getOutputMode(): OutputMode {
	return outputMode;
}

export function log(msg: string) {
	process.stderr.write(`${msg}\n`);
}

export function debug(...parts: unknown[]) {
	if (!verbose) return;
	process.stderr.write(
		`[debug] ${parts.map((p) => (typeof p === "string" ? p : JSON.stringify(p))).join(" ")}\n`,
	);
}

export function heartbeat(ch = ".") {
	if (!process.stderr.isTTY) return;
	process.stderr.write(ch);
}

/**
 * Render a human-readable preview of the result to stderr (does not affect
 * the machine-readable stdout payload). One section per output type.
 */
function renderDisplay(result: ToolResult): string | undefined {
	const lines: string[] = [];
	const urls: string[] = [];
	const texts: string[] = [];

	for (const a of result.outputs) {
		if (
			a.type === "image" ||
			a.type === "video" ||
			a.type === "audio" ||
			a.type === "file"
		) {
			urls.push(a.url);
		} else if (a.type === "text") {
			texts.push(a.text);
		}
		// json outputs have nothing user-friendly to show on stderr; skip.
	}

	if (urls.length > 0) lines.push(...urls);
	if (texts.length > 0) lines.push(...texts);

	const m = t().api;
	if (result.task?.generateId) {
		lines.push(
			m.taskSubmittedDisplay(result.task.generateId, result.task.status),
		);
	}

	return lines.length > 0 ? lines.join("\n") : undefined;
}

function writeStdout(env: OkEnvelope): void {
	if (outputMode === "json") {
		process.stdout.write(`${JSON.stringify(env, null, 2)}\n`);
		return;
	}
	if (outputMode === "url") {
		for (const a of env.result.outputs) {
			if (
				a.type === "image" ||
				a.type === "video" ||
				a.type === "audio" ||
				a.type === "file"
			) {
				process.stdout.write(`${a.url}\n`);
			}
		}
		return;
	}
	if (outputMode === "text") {
		for (const a of env.result.outputs) {
			if (a.type === "text") process.stdout.write(`${a.text}\n`);
		}
		return;
	}
}

export function emit(env: Envelope): never {
	if (env.ok) {
		// Stderr banner only in human-friendly json mode; piping with --output
		// url|text should keep stderr clean for downstream consumers.
		if (outputMode === "json") {
			const display = renderDisplay(env.result);
			if (display) {
				const m = t().api;
				process.stderr.write(`\n${m.displayBannerStart}\n`);
				process.stderr.write(`${display}\n`);
				process.stderr.write(`${m.displayBannerEnd}\n`);
				process.stderr.write(`${m.displayHint}\n\n`);
			}
		}
		writeStdout(env);
		if (env.result.warning) {
			process.stderr.write(`\n${env.result.warning}\n`);
		}
		process.exit(0);
	}
	process.stdout.write(`${JSON.stringify(env, null, 2)}\n`);
	process.exit(1);
}

export function success(result: ToolResult): never {
	return emit({ ok: true, result });
}

export function failure(
	code: string,
	message: string,
	details?: unknown,
	exitCode: 1 | 2 = 1,
): never {
	process.stdout.write(
		`${JSON.stringify({ ok: false, code, message, details }, null, 2)}\n`,
	);
	process.exit(exitCode);
}

export function usageError(message: string, details?: unknown): never {
	return failure("usage_error", message, details, 2);
}

/**
 * Convert a thrown error into a CLI failure envelope. Preserves SdkError
 * code/details/exitCode; wraps anything else as `internal_error`.
 */
export function emitError(err: unknown): never {
	if (err instanceof SdkError) {
		return failure(err.code, err.message, err.details, err.exitCode);
	}
	const message = err instanceof Error ? err.message : String(err);
	return failure("internal_error", message);
}

/** Re-export for consumers — keeps this module the single envelope surface. */
export type { Output, ToolResult };
