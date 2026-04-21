import * as fs from "node:fs";
import * as path from "node:path";
import type { z } from "zod";
import { encodeFileToBase64, getMimeType } from "../utils/utils";
import { failure, log, usageError } from "./envelope";
import type { FieldDescriptor } from "./schema";

const FILE_SIZE_WARN_BYTES = 25 * 1024 * 1024; // 25 MB
const FILE_SIZE_ERROR_BYTES = 100 * 1024 * 1024; // 100 MB

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
			return usageError(`--input file not found: ${p}`);
		}
		raw = fs.readFileSync(p, "utf8");
	} else {
		raw = spec;
	}
	try {
		return JSON.parse(raw);
	} catch (err) {
		return usageError(`--input is not valid JSON: ${(err as Error).message}`);
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

export function resolveFileValue(val: string, label: string): string {
	if (
		val.startsWith("http://") ||
		val.startsWith("https://") ||
		val.startsWith("data:")
	) {
		return val;
	}
	const p = path.resolve(val);
	if (!fs.existsSync(p)) {
		return failure("file_not_found", `${label}: file not found: ${p}`);
	}
	const stat = fs.statSync(p);
	if (stat.size > FILE_SIZE_ERROR_BYTES) {
		return failure(
			"file_too_large",
			`${label}: file is ${(stat.size / 1024 / 1024).toFixed(1)} MB, exceeds ${FILE_SIZE_ERROR_BYTES / 1024 / 1024} MB limit. Upload to object storage and pass the URL instead.`,
		);
	}
	if (stat.size > FILE_SIZE_WARN_BYTES) {
		log(
			`[warn] ${label}: file is ${(stat.size / 1024 / 1024).toFixed(1)} MB; prefer uploading and passing a URL to reduce memory use and request size.`,
		);
	}
	return `data:${getMimeType(p)};base64,${encodeFileToBase64(p)}`;
}

export type BuildInputOptions = {
	fields: FieldDescriptor[];
	flagValues: Record<string, unknown>;
	explicitInput?: unknown;
};

/**
 * Merge flag values + --input JSON, then resolve file-typed fields to data URIs.
 *
 * Precedence (later wins): explicitInput < flagValues. This lets an AI pass a
 * full JSON payload via --input and selectively override one field via a flag.
 */
export function buildInput(opts: BuildInputOptions): Record<string, unknown> {
	const input: Record<string, unknown> = {};

	if (opts.explicitInput !== undefined) {
		if (
			typeof opts.explicitInput !== "object" ||
			opts.explicitInput === null ||
			Array.isArray(opts.explicitInput)
		) {
			return usageError("--input must be a JSON object");
		}
		Object.assign(input, opts.explicitInput);
	}

	for (const field of opts.fields) {
		const v = opts.flagValues[field.key];
		if (v === undefined) continue;
		input[field.key] = v;
	}

	for (const field of opts.fields) {
		if (!field.mediaType) continue;
		const v = input[field.key];
		if (v === undefined) continue;
		if (field.isArray) {
			const arr = Array.isArray(v) ? v : [v];
			input[field.key] = arr.map((x) => resolveFileValue(String(x), field.key));
		} else {
			input[field.key] = resolveFileValue(String(v), field.key);
		}
	}

	return input;
}

export function validateInput(
	schema: z.ZodType,
	input: Record<string, unknown>,
): { ok: true; data: unknown } | { ok: false; issues: unknown } {
	const parsed = schema.safeParse(input);
	if (parsed.success) return { ok: true, data: parsed.data };
	return { ok: false, issues: parsed.error.issues };
}
