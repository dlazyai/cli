import { executeTool, executeToolBatch } from "../lib/api";
import { SdkError } from "../lib/envelope";
import { resolveMediaFields } from "../lib/input";
import type { ManifestTool } from "../lib/manifest";
import { describeSchema, type FieldDescriptor } from "../lib/schema";
import {
	findTool,
	getApiKey,
	getBaseUrl,
	getConfig,
	getManifest,
} from "./client";
import {
	arrayOf,
	type Handle,
	type HandleResult,
	isHandle,
	scalarOf,
} from "./handle";

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

export type RunOptions = {
	timeoutMs?: number;
	/** Wait for async tasks to finish (default true). */
	wait?: boolean;
	/**
	 * Run the tool N times in parallel and merge all outputs into a single
	 * ToolResult. Defaults to 1. Per-handle override: pass `batch` inside the
	 * tool input object (e.g. `sdk.seedream_4_5({ prompt, batch: 4 })`).
	 */
	batch?: number;
};

/**
 * Walk the input object, replacing every Handle with its resolved natural
 * value. Recursively schedules upstream handles via the supplied resolver.
 *
 * - In an array slot, each Handle is replaced with its scalar form, so
 *   arrays of handles flatten 1:1 to arrays of urls / strings.
 * - A bare Handle (not nested in an array) becomes its scalar form.
 * - Nested objects are walked recursively.
 */
async function substituteHandles(
	value: unknown,
	resolve: (h: Handle) => Promise<HandleResult>,
	inArraySlot = false,
): Promise<unknown> {
	if (isHandle(value)) {
		const result = await resolve(value);
		return inArraySlot ? scalarOf(result) : scalarOf(result);
	}
	if (Array.isArray(value)) {
		const out: unknown[] = [];
		for (const item of value) {
			if (isHandle(item)) {
				const result = await resolve(item);
				// In array context, prefer scalar (urls[0]) so [hero,hero] → [url,url].
				out.push(scalarOf(result));
			} else {
				out.push(await substituteHandles(item, resolve, true));
			}
		}
		return out;
	}
	if (value !== null && typeof value === "object") {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			out[k] = await substituteHandles(v, resolve, false);
		}
		return out;
	}
	return value;
}

/**
 * Top-level resolver: walks input and, when a Handle appears in a slot whose
 * field is declared as an array (per manifest), uses the handle's full array
 * form rather than its scalar (so a single handle naturally fills `videos`).
 */
async function substituteRoot(
	input: Record<string, unknown>,
	fields: FieldDescriptor[],
	resolve: (h: Handle) => Promise<HandleResult>,
): Promise<Record<string, unknown>> {
	const out: Record<string, unknown> = {};
	const fieldByKey = new Map(fields.map((f) => [f.key, f]));
	for (const [k, v] of Object.entries(input)) {
		const field = fieldByKey.get(k);
		if (field?.isArray && isHandle(v)) {
			const result = await resolve(v);
			out[k] = arrayOf(result);
			continue;
		}
		if (field?.isArray && Array.isArray(v)) {
			const arr: unknown[] = [];
			for (const item of v) {
				if (isHandle(item)) {
					const result = await resolve(item);
					arr.push(scalarOf(result));
				} else {
					arr.push(await substituteHandles(item, resolve, true));
				}
			}
			out[k] = arr;
			continue;
		}
		out[k] = await substituteHandles(v, resolve, false);
	}
	return out;
}

/**
 * Execute a single handle. Walks its input first to satisfy upstream
 * dependencies. Memoizes per-handle so a shared upstream is only run once.
 */
export async function runHandle(
	handle: Handle,
	opts: RunOptions = {},
): Promise<HandleResult> {
	const memo = new WeakMap<Handle, Promise<HandleResult>>();

	const resolve = (h: Handle): Promise<HandleResult> => {
		if (h.state.status === "done") return Promise.resolve(h.state.result);
		const existing = memo.get(h);
		if (existing) return existing;
		const promise = executeOne(h, resolve, opts);
		memo.set(h, promise);
		h.state = { status: "running", promise };
		promise.then(
			(result) => {
				h.state = { status: "done", result };
			},
			(error) => {
				h.state = { status: "failed", error };
			},
		);
		return promise;
	};

	return resolve(handle);
}

async function executeOne(
	handle: Handle,
	resolve: (h: Handle) => Promise<HandleResult>,
	opts: RunOptions,
): Promise<HandleResult> {
	const manifest = await getManifest();
	const tool = findTool(manifest, handle.toolName);
	if (!tool) {
		throw new SdkError(
			"tool_not_found",
			`Unknown tool: ${handle.toolName}`,
			{ availableTools: manifest.tools.map((t) => t.cli_name) },
			2,
		);
	}

	const fields = describeSchema(tool.inputJsonSchema);
	const apiKey = await getApiKey();
	const baseUrl = getBaseUrl();
	const config = getConfig();

	// `batch` is a runner directive, not a tool field — strip it from input.
	// Per-handle value (handle.input.batch) wins over RunOptions.batch.
	const rawBatch = handle.input.batch;
	const inputForTool: Record<string, unknown> = { ...handle.input };
	delete inputForTool.batch;
	const batch = Math.max(
		1,
		Math.floor(
			Number(typeof rawBatch === "number" ? rawBatch : (opts.batch ?? 1)),
		) || 1,
	);

	const substituted = await substituteRoot(inputForTool, fields, resolve);
	const resolved = await resolveMediaFields(substituted, fields, {
		apiKey,
		baseUrl,
	});

	const runOpts = {
		apiKey,
		baseUrl,
		tool,
		input: resolved,
		organizationId: config.organizationId,
		projectId: config.projectId,
		wait: opts.wait !== false,
		timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
	};

	if (batch > 1) return executeToolBatch({ ...runOpts, batch });
	return executeTool(runOpts);
}

/**
 * Public entry: execute a handle (and its upstream graph) and return the
 * resolved result envelope. Throws SdkError on any step failure.
 */
export async function run(
	handle: Handle,
	opts: RunOptions = {},
): Promise<HandleResult> {
	return runHandle(handle, opts);
}

/** Look up a tool's manifest record (for SDK consumers / codegen). */
export async function describeTool(name: string): Promise<ManifestTool> {
	const manifest = await getManifest();
	const tool = findTool(manifest, name);
	if (!tool) {
		throw new SdkError("tool_not_found", `Unknown tool: ${name}`, undefined, 2);
	}
	return tool;
}
