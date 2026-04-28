export type OkKind = "urls" | "text" | "shapes" | "generateId" | "raw";

export type OkEnvelope = {
	ok: true;
	kind: OkKind;
	data: unknown;
	display?: string;
};

export type ErrEnvelope = {
	ok: false;
	code: string;
	message: string;
	details?: unknown;
};

export type Envelope = OkEnvelope | ErrEnvelope;

let verbose = false;

export function setVerbose(v: boolean) {
	verbose = v;
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

export function emit(env: Envelope): never {
	if (env.ok && env.display) {
		// Lazy-load to avoid circular dep between envelope <-> messages.
		const { t } = require("../messages") as typeof import("../messages");
		const m = t().api;
		process.stderr.write(`\n${m.displayBannerStart}\n`);
		process.stderr.write(`${env.display}\n`);
		process.stderr.write(`${m.displayBannerEnd}\n`);
		process.stderr.write(`${m.displayHint}\n\n`);
	}
	// Strip `display` — it's a stderr-only hint, not part of the machine-readable payload.
	const payload: Envelope = env.ok
		? { ok: env.ok, kind: env.kind, data: env.data }
		: env;
	process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
	process.exit(env.ok ? 0 : 1);
}

export function success(kind: OkKind, data: unknown, display?: string): never {
	const env: OkEnvelope = { ok: true, kind, data };
	if (display) env.display = display;
	return emit(env);
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
