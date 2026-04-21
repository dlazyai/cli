export type OkKind = "urls" | "text" | "shapes" | "generateId" | "raw";

export type OkEnvelope = {
	ok: true;
	kind: OkKind;
	data: unknown;
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
	process.stdout.write(`${JSON.stringify(env)}\n`);
	process.exit(env.ok ? 0 : 1);
}

export function success(kind: OkKind, data: unknown): never {
	return emit({ ok: true, kind, data });
}

export function failure(
	code: string,
	message: string,
	details?: unknown,
	exitCode: 1 | 2 = 1,
): never {
	process.stdout.write(
		`${JSON.stringify({ ok: false, code, message, details })}\n`,
	);
	process.exit(exitCode);
}

export function usageError(message: string, details?: unknown): never {
	return failure("usage_error", message, details, 2);
}
