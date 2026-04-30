/**
 * Read piped stdin once per CLI invocation, cache the parsed value so
 * multiple `--flag -` references don't try to re-read an already-consumed
 * stream.
 *
 * Returns null when stdin is a TTY (interactive shell, no upstream pipe).
 */

let cache: { raw: string; parsed: unknown } | null | undefined;

export function _resetStdinCache(): void {
	cache = undefined;
}

/** For tests: inject the cache without actually reading stdin. */
export function _setStdinCache(
	value: { raw: string; parsed: unknown } | null,
): void {
	cache = value;
}

export async function readStdinOnce(): Promise<{
	raw: string;
	parsed: unknown;
} | null> {
	if (cache !== undefined) return cache;
	if (process.stdin.isTTY) {
		cache = null;
		return cache;
	}
	const chunks: Buffer[] = [];
	for await (const c of process.stdin) {
		chunks.push(c as Buffer);
	}
	const raw = Buffer.concat(chunks).toString("utf8").trim();
	if (!raw) {
		cache = null;
		return cache;
	}
	let parsed: unknown = raw;
	try {
		parsed = JSON.parse(raw);
	} catch {
		// Plain text input — keep raw as the value.
	}
	cache = { raw, parsed };
	return cache;
}
