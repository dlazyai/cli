import * as crypto from "node:crypto";
import type { ManifestTool } from "./manifest";

// ---------------------------------------------------------------------------
// Unified output contract for tool runs.
//
// One ToolResult per tool invocation. `outputs` is always an array (never a
// scalar / "kind"-tagged blob). Each output carries its own type and
// type-specific fields; tools may add to `meta` freely.
//
// Async tasks (when wait=false) return outputs=[] and a `task` handle.
// ---------------------------------------------------------------------------

export type OutputType = "image" | "video" | "audio" | "file" | "text" | "json";

export type MediaOutput = {
	type: "image" | "video" | "audio" | "file";
	id: string;
	url: string;
	mimeType?: string;
	bytes?: number;
	width?: number;
	height?: number;
	durationMs?: number;
	fps?: number;
	thumbnailUrl?: string;
	meta?: Record<string, unknown>;
};

export type TextOutput = {
	type: "text";
	id: string;
	text: string;
	format?: "plain" | "markdown" | "json" | "srt" | "vtt";
	meta?: Record<string, unknown>;
};

export type JsonOutput = {
	type: "json";
	id: string;
	value: unknown;
	meta?: Record<string, unknown>;
};

export type Output = MediaOutput | TextOutput | JsonOutput;

export type Usage = {
	creditsCost?: number;
	durationMs?: number;
	tokenIn?: number;
	tokenOut?: number;
};

export type TaskHandle = {
	generateId: string;
	status: "pending" | "running";
};

export type ToolResult = {
	tool: string;
	modelId: string;
	outputs: Output[];
	usage?: Usage;
	task?: TaskHandle;
	/**
	 * Server-side advisory warning, e.g. CLI is older than the latest published
	 * version. CLI surface prints this to stderr after rendering the result;
	 * SDK consumers can read it directly off `ToolResult.warning`.
	 */
	warning?: string;
};

// ---------------------------------------------------------------------------
// Conversion: raw provider response → ToolResult
// ---------------------------------------------------------------------------

const IMAGE_EXTS = new Set([
	"jpg",
	"jpeg",
	"png",
	"webp",
	"gif",
	"svg",
	"bmp",
	"avif",
]);
const VIDEO_EXTS = new Set(["mp4", "mov", "webm", "mkv", "m4v"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "m4a", "flac", "aac"]);

function extOf(url: string): string | undefined {
	const m = url.toLowerCase().match(/\.([a-z0-9]+)(?:[?#]|$)/);
	return m ? m[1] : undefined;
}

function mimeFromUrl(url: string): string | undefined {
	const ext = extOf(url);
	if (!ext) return undefined;
	if (IMAGE_EXTS.has(ext)) return `image/${ext === "jpg" ? "jpeg" : ext}`;
	if (VIDEO_EXTS.has(ext)) return `video/${ext === "mov" ? "quicktime" : ext}`;
	if (AUDIO_EXTS.has(ext)) return `audio/${ext === "m4a" ? "mp4" : ext}`;
	return undefined;
}

function detectMediaType(
	url: string,
	hint: ManifestTool["type"],
): "image" | "video" | "audio" | "file" {
	if (hint === "image" || hint === "video" || hint === "audio") return hint;
	const ext = extOf(url);
	if (ext) {
		if (IMAGE_EXTS.has(ext)) return "image";
		if (VIDEO_EXTS.has(ext)) return "video";
		if (AUDIO_EXTS.has(ext)) return "audio";
	}
	return "file";
}

/**
 * Deterministic id based on seed (typically toolId + payload-derived) and
 * index. Same inputs always produce the same id, which keeps batch outputs
 * stable for snapshot tests and idempotent client-side caches.
 */
function makeId(seed: string, index: number): string {
	const hash = crypto
		.createHash("sha1")
		.update(`${seed}#${index}`)
		.digest("hex")
		.slice(0, 8);
	return `o_${hash}`;
}

/** Short, deterministic content hash. Replaces Date.now()-based id seeds. */
function stableHash(value: unknown): string {
	let serialized: string;
	try {
		serialized = JSON.stringify(value) ?? "null";
	} catch {
		serialized = String(value);
	}
	return crypto
		.createHash("sha1")
		.update(serialized)
		.digest("hex")
		.slice(0, 12);
}

function isObj(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null;
}

export function isGenerateIdOutput(
	output: unknown,
): output is { generateId: string; status?: string } {
	if (!isObj(output)) return false;
	const id = output.generateId;
	return typeof id === "string" && id.length > 0;
}

// Shape fields that exist purely for canvas rendering (position / size). The
// CLI surface drops them so terminal consumers see only the data-bearing
// properties (type, props.name, props.url, props.model, props.input, ...).
const SHAPE_CANVAS_FIELDS: ReadonlySet<string> = new Set(["x", "y"]);
const SHAPE_CANVAS_PROPS: ReadonlySet<string> = new Set(["w", "h"]);

export function stripCanvasShape(
	shape: Record<string, unknown>,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(shape)) {
		if (SHAPE_CANVAS_FIELDS.has(k)) continue;
		if (k === "props" && isObj(v)) {
			const cleaned: Record<string, unknown> = {};
			for (const [pk, pv] of Object.entries(v)) {
				if (SHAPE_CANVAS_PROPS.has(pk)) continue;
				cleaned[pk] = pv;
			}
			out[k] = cleaned;
			continue;
		}
		out[k] = v;
	}
	return out;
}

function extractUsage(raw: unknown): Usage | undefined {
	if (!isObj(raw)) return undefined;
	const u: Usage = {};
	if (typeof raw.creditsCost === "number") u.creditsCost = raw.creditsCost;
	if (typeof raw.durationMs === "number") u.durationMs = raw.durationMs;
	if (typeof raw.tokenIn === "number") u.tokenIn = raw.tokenIn;
	if (typeof raw.tokenOut === "number") u.tokenOut = raw.tokenOut;
	return Object.keys(u).length === 0 ? undefined : u;
}

function buildMediaOutput(
	url: string,
	tool: ManifestTool,
	idx: number,
	idSeed: string,
	overrides?: Partial<MediaOutput>,
): MediaOutput {
	const type = detectMediaType(url, tool.type);
	return {
		type,
		id: makeId(idSeed, idx),
		url,
		mimeType: mimeFromUrl(url),
		...overrides,
	};
}

/**
 * Convert a raw provider output payload into a ToolResult. Pure function;
 * only place in the codebase that constructs Outputs.
 *
 * Rules:
 *  - { generateId } → no outputs; populate `task` instead.
 *  - { urls: [...] } → one media output per url, type from tool.type or url ext.
 *  - { text: "..." } → one TextOutput.
 *  - any other shape → one JsonOutput carrying the value. Payloads with
 *    `shapes` (canvas-only concept) fall into this bucket too: the CLI has
 *    no canvas, so we expose them as plain JSON, with each shape's
 *    canvas-only fields (x/y/w/h) stripped first.
 */
export function toToolResult(
	rawOutput: unknown,
	tool: ManifestTool,
): ToolResult {
	const idSeed = `${tool.id}:${stableHash(rawOutput)}`;
	const usage = extractUsage(rawOutput);

	if (isGenerateIdOutput(rawOutput)) {
		const status = rawOutput.status === "running" ? "running" : "pending";
		return {
			tool: tool.cli_name,
			modelId: tool.id,
			outputs: [],
			usage,
			task: { generateId: rawOutput.generateId, status },
		};
	}

	const outputs: Output[] = [];

	if (isObj(rawOutput)) {
		const urls = (rawOutput as { urls?: unknown }).urls;
		const text = (rawOutput as { text?: unknown }).text;

		if (Array.isArray(urls)) {
			urls.forEach((u, i) => {
				if (typeof u !== "string") return;
				outputs.push(buildMediaOutput(u, tool, i, idSeed));
			});
		}

		if (typeof text === "string") {
			outputs.push({
				type: "text",
				id: makeId(idSeed, outputs.length),
				text,
			});
		}
	}

	if (outputs.length === 0) {
		outputs.push({
			type: "json",
			id: makeId(idSeed, 0),
			value: cleanJsonValue(rawOutput),
		});
	}

	return {
		tool: tool.cli_name,
		modelId: tool.id,
		outputs,
		usage,
	};
}

/**
 * Pre-process a raw payload that's about to be wrapped in a JsonOutput.
 * Currently strips canvas-render fields (x/y/w/h) from any `shapes[]` array,
 * since the CLI has no canvas and exposing them is just noise.
 */
function cleanJsonValue(raw: unknown): unknown {
	if (!isObj(raw)) return raw;
	const shapes = (raw as { shapes?: unknown }).shapes;
	if (!Array.isArray(shapes)) return raw;
	return {
		...raw,
		shapes: shapes.map((s) => (isObj(s) ? stripCanvasShape(s) : s)),
	};
}

// ---------------------------------------------------------------------------
// Helpers consumed by SDK / CLI display
// ---------------------------------------------------------------------------

/**
 * Wrap a plain JSON value as a single-output ToolResult. Used by meta
 * commands (`tools list`, `tools describe`) and `--dry-run` so they share
 * the same envelope shape as real tool runs.
 */
export function jsonResult(
	toolName: string,
	value: unknown,
	modelId?: string,
): ToolResult {
	const idSeed = `${toolName}:${stableHash(value)}`;
	return {
		tool: toolName,
		modelId: modelId ?? toolName,
		outputs: [{ type: "json", id: makeId(idSeed, 0), value }],
	};
}

/**
 * Merge N ToolResults from a batch run into a single envelope.
 *
 * - `outputs` are concatenated in batch order, ids preserved.
 * - `usage.creditsCost` / `tokenIn` / `tokenOut` are summed; `durationMs`
 *   takes the max (parallel wallclock).
 * - When wait=false each sub-result has `task` and empty outputs; tasks are
 *   surfaced as JsonOutputs so downstream pipes can still see them.
 */
export function mergeToolResults(results: ToolResult[]): ToolResult {
	if (results.length === 0) {
		throw new Error("mergeToolResults: empty results array");
	}
	if (results.length === 1) return results[0]!;

	const head = results[0]!;
	const outputs: Output[] = [];
	const usage: Partial<Usage> = {};
	const idSeed = `${head.modelId}:batch:${stableHash(results)}`;
	let taskIdx = 0;

	for (const r of results) {
		outputs.push(...r.outputs);
		if (r.task) {
			outputs.push({
				type: "json",
				id: makeId(idSeed, taskIdx++),
				value: { generateId: r.task.generateId, status: r.task.status },
			});
		}
		if (r.usage) {
			if (typeof r.usage.creditsCost === "number") {
				usage.creditsCost = (usage.creditsCost ?? 0) + r.usage.creditsCost;
			}
			if (typeof r.usage.durationMs === "number") {
				usage.durationMs = Math.max(usage.durationMs ?? 0, r.usage.durationMs);
			}
			if (typeof r.usage.tokenIn === "number") {
				usage.tokenIn = (usage.tokenIn ?? 0) + r.usage.tokenIn;
			}
			if (typeof r.usage.tokenOut === "number") {
				usage.tokenOut = (usage.tokenOut ?? 0) + r.usage.tokenOut;
			}
		}
	}

	return {
		tool: head.tool,
		modelId: head.modelId,
		outputs,
		usage: Object.keys(usage).length > 0 ? (usage as Usage) : undefined,
	};
}

/** Primary value of a single output (url for media, text for text, etc.). */
export function primaryValue(o: Output): unknown {
	switch (o.type) {
		case "image":
		case "video":
		case "audio":
		case "file":
			return o.url;
		case "text":
			return o.text;
		case "json":
			return o.value;
	}
}
