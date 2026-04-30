import { SdkError } from "./envelope";
import { type Output, primaryValue, type ToolResult } from "./output";
import type { FieldDescriptor } from "./schema";
import { readStdinOnce } from "./stdin";

/**
 * Reference syntax accepted by --flag values:
 *
 *   -                 → upstream's natural value for this field
 *                      (scalar or array based on field.isArray)
 *   @<n>              → n-th output's primary value (url/text/value)
 *   @<n>.<jsonpath>   → drill into the n-th output (e.g. @0.url, @1.meta.fps)
 *   @*                → all outputs as an array of primary values
 *   @stdin            → the entire piped JSON value (raw envelope)
 *   @stdin:<jsonpath> → jsonpath into the entire piped value
 *
 * Anything else is returned unchanged.
 */

// Strict ref grammar — disallow trailing empty segments like `@stdin:` or
// `@0.` which would otherwise jsonpath into an empty string and silently
// return the root.
const REF_RE = /^(?:-|@(?:\*|stdin(?::[^.\s].*)?|\d+(?:\.[^\s].*)?))$/;

export function isRef(v: unknown): v is string {
	return typeof v === "string" && REF_RE.test(v);
}

/**
 * Resolve a single value. Reads stdin lazily (and only once across the
 * whole command) the first time a ref is encountered.
 */
export async function resolveRefValue(
	raw: unknown,
	field: FieldDescriptor,
): Promise<unknown> {
	if (typeof raw !== "string") return raw;
	if (!isRef(raw)) return raw;

	const stdin = await readStdinOnce();
	if (!stdin) {
		throw new SdkError(
			"no_stdin",
			`--${field.key} references piped input but stdin is empty`,
		);
	}

	if (raw === "-") return autoPick(stdin.parsed, field);

	// Strip leading `@`
	const expr = raw.slice(1);

	if (expr === "*") return allOutputsValue(stdin.parsed);

	if (expr === "stdin") return stdin.parsed;

	if (expr.startsWith("stdin:")) {
		return jsonpath(stdin.parsed, expr.slice("stdin:".length));
	}

	// `<n>` or `<n>.<jsonpath>`
	const dot = expr.indexOf(".");
	const idxStr = dot === -1 ? expr : expr.slice(0, dot);
	const tail = dot === -1 ? "" : expr.slice(dot + 1);
	const idx = Number(idxStr);
	if (!Number.isInteger(idx) || idx < 0) {
		throw new SdkError(
			"bad_ref",
			`Invalid reference '${raw}': output index must be a non-negative integer`,
		);
	}

	const output = outputAt(stdin.parsed, idx);
	if (!output) {
		throw new SdkError(
			"bad_ref",
			`Reference '${raw}' has no output at index ${idx}`,
		);
	}
	if (!tail) return primaryValue(output);

	// `@N.url` is a common shorthand: project the output then jsonpath into it.
	return jsonpath(output, tail);
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

type StdinShape = unknown;

function getResult(parsed: StdinShape): ToolResult | undefined {
	if (parsed && typeof parsed === "object") {
		const env = parsed as { ok?: boolean; result?: unknown };
		if (env.ok === true && env.result && typeof env.result === "object") {
			return env.result as ToolResult;
		}
	}
	return undefined;
}

function outputAt(parsed: StdinShape, idx: number): Output | undefined {
	const result = getResult(parsed);
	const outputs = result?.outputs;
	if (!Array.isArray(outputs)) return undefined;
	return outputs[idx];
}

function allOutputsValue(parsed: StdinShape): unknown[] {
	const result = getResult(parsed);
	const outputs = result?.outputs;
	if (!Array.isArray(outputs)) return [];
	return outputs.map(primaryValue);
}

/**
 * Pick the natural value for a `-` reference based on the receiving field:
 *  - array field → all output primary values as an array
 *  - scalar field → the first output's primary value
 *  - if upstream is plain text/JSON (no envelope), pass it through directly
 */
function autoPick(parsed: StdinShape, field: FieldDescriptor): unknown {
	if (typeof parsed === "string") return parsed;
	const result = getResult(parsed);
	if (!result) return parsed;
	const outputs = result.outputs;
	if (!Array.isArray(outputs) || outputs.length === 0) return undefined;
	if (field.isArray) return outputs.map(primaryValue);
	return primaryValue(outputs[0]!);
}

/**
 * jq-lite path resolver: supports `a.b.c`, `a[0]`, `a.b[2].c`. No filters,
 * wildcards, or recursion — adequate for piping single values out of an
 * envelope.
 */
function jsonpath(root: unknown, expr: string): unknown {
	const tokens = expr.match(/[^.[\]]+|\[\d+\]/g) ?? [];
	let cur: unknown = root;
	for (const t of tokens) {
		if (cur == null) return undefined;
		if (t.startsWith("[") && t.endsWith("]")) {
			const i = Number(t.slice(1, -1));
			cur = (cur as unknown[])[i];
		} else {
			cur = (cur as Record<string, unknown>)[t];
		}
	}
	return cur;
}
