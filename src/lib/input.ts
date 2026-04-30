import * as fs from "node:fs";
import * as path from "node:path";
import { t } from "../messages";
import { log, SdkError } from "./envelope";
import { resolveRefValue } from "./refs";
import type { FieldDescriptor } from "./schema";
import { type UploadContext, uploadDataUrl, uploadLocalFile } from "./upload";

const FILE_SIZE_WARN_BYTES = 100 * 1024 * 1024; // 100 MB
const FILE_SIZE_ERROR_BYTES = 500 * 1024 * 1024; // 500 MB

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
			throw new SdkError(
				"upload_failed",
				t().input.uploadFailed(label, (err as Error).message),
			);
		}
	}

	const p = path.resolve(val);
	if (!fs.existsSync(p)) {
		throw new SdkError("file_not_found", t().input.fileNotFound(label, p));
	}
	const stat = fs.statSync(p);
	if (stat.size > FILE_SIZE_ERROR_BYTES) {
		throw new SdkError(
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
		throw new SdkError(
			"upload_failed",
			t().input.uploadFailed(label, (err as Error).message),
		);
	}
}

export type BuildInputOptions = {
	fields: FieldDescriptor[];
	flagValues: Record<string, unknown>;
	/**
	 * Pre-supplied input (e.g. from `--input <file>` JSON). Flag values
	 * always win over keys in `explicitInput`.
	 */
	explicitInput?: Record<string, unknown>;
};

/**
 * Merge explicit-input (e.g. from `--input file.json`) with commander flag
 * values into a single payload object.
 *
 * - All keys from `explicitInput` pass through (server may accept extra fields).
 * - Schema-known field keys with a flag value override `explicitInput`.
 *
 * Media-typed fields are NOT resolved here — call `resolveMediaFields` once
 * an upload context (api key + base url) is available.
 */
export function buildInput(opts: BuildInputOptions): Record<string, unknown> {
	const input: Record<string, unknown> = { ...(opts.explicitInput ?? {}) };
	for (const field of opts.fields) {
		const flagVal = opts.flagValues[field.key];
		if (flagVal !== undefined) input[field.key] = flagVal;
	}
	return input;
}

/**
 * Replace any pipe references (`-`, `@<n>`, `@*`, `@stdin:...`) with their
 * resolved values. Walks every field; recurses through array values so a
 * single `--videos @0,@1` style array also works.
 *
 * Runs BEFORE resolveMediaFields so that piped urls are uploaded only when
 * they aren't already public URLs (which they typically are).
 */
export async function resolveRefs(
	input: Record<string, unknown>,
	fields: FieldDescriptor[],
): Promise<Record<string, unknown>> {
	const out: Record<string, unknown> = { ...input };
	for (const field of fields) {
		const v = out[field.key];
		if (v === undefined) continue;
		if (Array.isArray(v)) {
			const resolved: unknown[] = [];
			for (const item of v) {
				const r = await resolveRefValue(item, field);
				if (Array.isArray(r)) resolved.push(...r);
				else resolved.push(r);
			}
			out[field.key] = resolved;
		} else {
			out[field.key] = await resolveRefValue(v, field);
		}
	}
	return out;
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
