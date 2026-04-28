import * as fs from "node:fs";
import * as path from "node:path";
import type { z } from "zod";
import { t } from "../messages";
import { failure, log, usageError } from "./envelope";
import type { FieldDescriptor } from "./schema";
import { type UploadContext, uploadDataUrl, uploadLocalFile } from "./upload";

const FILE_SIZE_WARN_BYTES = 100 * 1024 * 1024; // 100 MB
const FILE_SIZE_ERROR_BYTES = 500 * 1024 * 1024; // 500 MB

/**
 * Load a JSON payload from one of:
 *  - `-` → read stdin
 *  - `@path/to.json` → read file
 *  - `{...}` → inline JSON string
 */
export async function loadJsonInput(spec: string): Promise<unknown> {
	let raw: string;
	if (spec === "-") {
		raw = await readStdin();
	} else if (spec.startsWith("@")) {
		const p = path.resolve(spec.slice(1));
		if (!fs.existsSync(p)) {
			return usageError(t().input.inputFileNotFound(p));
		}
		raw = fs.readFileSync(p, "utf8");
	} else {
		raw = spec;
	}
	try {
		return JSON.parse(raw);
	} catch (err) {
		return usageError(t().input.invalidJson((err as Error).message));
	}
}

function readStdin(): Promise<string> {
	return new Promise((resolve, reject) => {
		if (process.stdin.isTTY) {
			resolve("");
			return;
		}
		let data = "";
		process.stdin.setEncoding("utf8");
		process.stdin.on("data", (chunk) => {
			data += chunk;
		});
		process.stdin.on("end", () => resolve(data));
		process.stdin.on("error", reject);
	});
}

/**
 * Resolve a media-typed value to a publicly-reachable URL.
 *
 * - `http(s)://...` → returned as-is
 * - `data:...` → uploaded to object storage, URL returned
 * - local path → uploaded to object storage, URL returned
 */
export async function resolveFileValue(
	val: string,
	label: string,
	ctx: UploadContext,
): Promise<string> {
	if (val.startsWith("http://") || val.startsWith("https://")) return val;

	if (val.startsWith("data:")) {
		try {
			return await uploadDataUrl(val, ctx);
		} catch (err) {
			return failure(
				"upload_failed",
				t().input.uploadFailed(label, (err as Error).message),
			);
		}
	}

	const p = path.resolve(val);
	if (!fs.existsSync(p)) {
		return failure("file_not_found", t().input.fileNotFound(label, p));
	}
	const stat = fs.statSync(p);
	if (stat.size > FILE_SIZE_ERROR_BYTES) {
		return failure(
			"file_too_large",
			t().input.fileTooLarge(
				label,
				(stat.size / 1024 / 1024).toFixed(1),
				FILE_SIZE_ERROR_BYTES / 1024 / 1024,
			),
		);
	}
	if (stat.size > FILE_SIZE_WARN_BYTES) {
		log(t().input.fileSizeWarn(label, (stat.size / 1024 / 1024).toFixed(1)));
	}
	try {
		return await uploadLocalFile(p, ctx);
	} catch (err) {
		return failure(
			"upload_failed",
			t().input.uploadFailed(label, (err as Error).message),
		);
	}
}

export type BuildInputOptions = {
	fields: FieldDescriptor[];
	flagValues: Record<string, unknown>;
	explicitInput?: unknown;
};

/**
 * Merge flag values + --input JSON into a single payload object.
 *
 * Precedence (later wins): explicitInput < flagValues. This lets an AI pass a
 * full JSON payload via --input and selectively override one field via a flag.
 *
 * Media-typed fields are NOT resolved here — call `resolveMediaFields` once
 * an upload context (api key + base url) is available.
 */
export function buildInput(opts: BuildInputOptions): Record<string, unknown> {
	const input: Record<string, unknown> = {};

	if (opts.explicitInput !== undefined) {
		if (
			typeof opts.explicitInput !== "object" ||
			opts.explicitInput === null ||
			Array.isArray(opts.explicitInput)
		) {
			return usageError(t().input.inputMustBeObject);
		}
		Object.assign(input, opts.explicitInput);
	}

	for (const field of opts.fields) {
		const v = opts.flagValues[field.key];
		if (v === undefined) continue;
		input[field.key] = v;
	}

	return input;
}

/**
 * Walk media-typed fields and resolve each to a public URL, uploading local
 * files / data URLs to object storage as needed.
 */
export async function resolveMediaFields(
	input: Record<string, unknown>,
	fields: FieldDescriptor[],
	ctx: UploadContext,
): Promise<Record<string, unknown>> {
	const out: Record<string, unknown> = { ...input };
	for (const field of fields) {
		if (!field.mediaType) continue;
		const v = out[field.key];
		if (v === undefined) continue;
		if (field.isArray) {
			const arr = Array.isArray(v) ? v : [v];
			const resolved: string[] = [];
			for (const x of arr) {
				resolved.push(await resolveFileValue(String(x), field.key, ctx));
			}
			out[field.key] = resolved;
		} else {
			out[field.key] = await resolveFileValue(String(v), field.key, ctx);
		}
	}
	return out;
}

export function validateInput(
	schema: z.ZodType,
	input: Record<string, unknown>,
): { ok: true; data: unknown } | { ok: false; issues: unknown } {
	const parsed = schema.safeParse(input);
	if (parsed.success) return { ok: true, data: parsed.data };
	return { ok: false, issues: parsed.error.issues };
}
