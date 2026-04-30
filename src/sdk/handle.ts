import { primaryValue, type ToolResult } from "../lib/output";

const HANDLE_BRAND = Symbol.for("dlazy.sdk.handle");

export type HandleState =
	| { status: "pending" }
	| { status: "running"; promise: Promise<HandleResult> }
	| { status: "done"; result: HandleResult }
	| { status: "failed"; error: unknown };

export type HandleResult = ToolResult;

/**
 * Lazy reference to a tool invocation. Constructed synchronously by tool()
 * / sdk proxy; resolved by run() (or when awaited via thenable).
 *
 * A Handle is also a PromiseLike — `await handle` triggers run() and yields
 * the ToolResult.
 */
export class Handle implements PromiseLike<HandleResult> {
	readonly [HANDLE_BRAND] = true;
	state: HandleState = { status: "pending" };
	/** Set by the runner the first time it sees this handle. */
	scheduler?: (h: Handle) => Promise<HandleResult>;

	constructor(
		public readonly toolName: string,
		public readonly input: Record<string, unknown>,
	) {}

	// biome-ignore lint/suspicious/noThenProperty: Handle is intentionally a PromiseLike so `await handle` triggers run().
	then<R1 = HandleResult, R2 = never>(
		onFulfilled?: ((value: HandleResult) => R1 | PromiseLike<R1>) | null,
		onRejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
	): PromiseLike<R1 | R2> {
		const exec = async (): Promise<HandleResult> => {
			if (!this.scheduler) {
				const { runHandle } = await import("./runner");
				return runHandle(this);
			}
			return this.scheduler(this);
		};
		return exec().then(onFulfilled, onRejected);
	}
}

export function isHandle(v: unknown): v is Handle {
	return (
		typeof v === "object" &&
		v !== null &&
		(v as Record<symbol, unknown>)[HANDLE_BRAND] === true
	);
}

/**
 * The "natural" single value of a tool result, used when the handle is
 * spliced into a non-array input slot (e.g. `image: hero`).
 *
 * Returns the primary value of the first output: url for media, text for
 * text outputs, value for json outputs.
 */
export function scalarOf(result: HandleResult): unknown {
	const o = result.outputs[0];
	return o ? primaryValue(o) : undefined;
}

/**
 * The "natural" array value of a tool result, used when the handle is
 * spliced into an array-typed input slot. Each output contributes its
 * primary value.
 */
export function arrayOf(result: HandleResult): unknown[] {
	return result.outputs.map(primaryValue);
}
