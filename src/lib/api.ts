import type { z } from "zod";
import { t } from "../messages";
import { sleep } from "../utils/utils";
import {
	debug,
	failure,
	heartbeat,
	log,
	type OkKind,
	success,
} from "./envelope";
import { inferOutputKind } from "./schema";

export type MediaHint = "image" | "video" | "audio" | "text" | "tool" | "auto";

export type RunOptions = {
	apiKey: string;
	baseUrl: string;
	modelId: string;
	input: Record<string, unknown>;
	organizationId?: string;
	projectId?: string;
	outputSchema?: z.ZodType;
	mediaType?: MediaHint;
	wait: boolean;
	timeoutMs: number;
	pollIntervalMs?: number;
};

type PollResponse = {
	status?: string;
	result?: unknown;
	error?: string | null;
};

type PostResponse = {
	output?: unknown;
};

function buildHeaders(apiKey: string): HeadersInit {
	return {
		Authorization: `Bearer ${apiKey}`,
		"Content-Type": "application/json",
	};
}

function isGenerateIdOutput(
	output: unknown,
): output is { generateId: string; status?: string; message?: string } {
	if (!output || typeof output !== "object") return false;
	const id = (output as { generateId?: unknown }).generateId;
	return typeof id === "string" && id.length > 0;
}

function isUrlsOutput(
	output: unknown,
): output is { urls: string[]; data?: unknown } {
	return (
		typeof output === "object" &&
		output !== null &&
		Array.isArray((output as { urls?: unknown[] }).urls)
	);
}

function isShapesOutput(output: unknown): output is { shapes: unknown[] } {
	return (
		typeof output === "object" &&
		output !== null &&
		Array.isArray((output as { shapes?: unknown[] }).shapes)
	);
}

function isTextOutput(output: unknown): output is { text: string } {
	return (
		typeof output === "object" &&
		output !== null &&
		typeof (output as { text?: unknown }).text === "string"
	);
}

function detectMediaFromUrl(
	url: string,
): "image" | "video" | "audio" | undefined {
	const m = url.toLowerCase().match(/\.([a-z0-9]+)(?:[?#]|$)/);
	if (!m) return undefined;
	const ext = m[1];
	if (["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "avif"].includes(ext))
		return "image";
	if (["mp4", "mov", "webm", "mkv", "m4v"].includes(ext)) return "video";
	if (["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(ext)) return "audio";
	return undefined;
}

function renderUrlsPlain(urls: string[]): string {
	return urls.join("\n");
}

function renderDisplay(
	kind: OkKind,
	data: unknown,
	mediaType?: MediaHint,
): string | undefined {
	if (kind === "urls") {
		const urls = (data as { urls?: unknown }).urls;
		if (!Array.isArray(urls) || urls.length === 0) return undefined;
		const strUrls = urls.filter((u): u is string => typeof u === "string");
		if (strUrls.length === 0) return undefined;
		return renderUrlsPlain(strUrls);
	}
	if (kind === "text") {
		const text = (data as { text?: unknown }).text;
		return typeof text === "string" && text.length > 0 ? text : undefined;
	}
	if (kind === "shapes") {
		const shapes = (data as { shapes?: unknown }).shapes;
		if (!Array.isArray(shapes)) return undefined;
		return t().api.shapesGenerated(shapes.length);
	}
	if (kind === "generateId") {
		const d = data as { generateId?: string; status?: string };
		if (!d?.generateId) return undefined;
		return t().api.taskSubmittedDisplay(d.generateId, d.status ?? "pending");
	}
	return undefined;
}

function emitResult(
	result: unknown,
	outputSchema?: z.ZodType,
	mediaType?: MediaHint,
): never {
	log(t().api.generationCompleted);
	const schemaKind = outputSchema ? inferOutputKind(outputSchema) : "raw";
	if (outputSchema) {
		const parsed = outputSchema.safeParse(result);
		if (parsed.success) {
			return success(
				schemaKind,
				parsed.data,
				renderDisplay(schemaKind, parsed.data, mediaType),
			);
		}
		debug("outputSchema parse failed", parsed.error.issues);
	}
	if (isUrlsOutput(result)) {
		const data = { urls: result.urls };
		return success("urls", data, renderDisplay("urls", data, mediaType));
	}
	if (isShapesOutput(result)) {
		const data = { shapes: result.shapes };
		return success("shapes", data, renderDisplay("shapes", data, mediaType));
	}
	if (isTextOutput(result)) {
		const data = { text: result.text };
		return success("text", data, renderDisplay("text", data, mediaType));
	}
	return success("raw", result);
}

export async function apiPostRun(opts: RunOptions): Promise<never> {
	const endpoint = opts.baseUrl.replace(/\/$/, "");
	const headers = buildHeaders(opts.apiKey);

	const body: Record<string, unknown> = {
		model: opts.modelId,
		input: opts.input,
	};
	if (opts.organizationId) body.organizationId = opts.organizationId;
	if (opts.projectId) body.projectId = opts.projectId;

	log(t().api.invoking(opts.modelId));
	debug("payload", body);

	let response: Response;
	try {
		response = await fetch(endpoint, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});
	} catch (err) {
		return failure("network_error", (err as Error).message);
	}

	if (!response.ok) {
		const text = await response.text();
		let details: unknown = text;
		try {
			details = JSON.parse(text);
		} catch {
			/* keep as text */
		}
		let code = "http_error";
		if (response.status === 401) code = "unauthorized";
		else if (response.status === 403) code = "forbidden";
		else if (response.status === 400) {
			code = "invalid_request";
			if (text.toLowerCase().includes("balance")) code = "insufficient_balance";
		}
		return failure(code, t().api.requestFailed(response.status), details);
	}

	const json = (await response.json()) as PostResponse;
	const output = json.output;

	if (isGenerateIdOutput(output)) {
		if (!opts.wait) {
			const data = {
				generateId: output.generateId,
				status: output.status ?? "pending",
			};
			return success(
				"generateId",
				data,
				renderDisplay("generateId", data, opts.mediaType),
			);
		}
		log(t().api.taskSubmitted(output.generateId));
		return await pollUntilDone({
			generateId: output.generateId,
			endpoint,
			headers,
			timeoutMs: opts.timeoutMs,
			pollIntervalMs: opts.pollIntervalMs ?? 3000,
			outputSchema: opts.outputSchema,
			mediaType: opts.mediaType,
		});
	}

	emitResult(output, opts.outputSchema, opts.mediaType);
}

export async function apiStatus(opts: {
	apiKey: string;
	baseUrl: string;
	generateId: string;
	wait: boolean;
	timeoutMs: number;
	pollIntervalMs?: number;
	outputSchema?: z.ZodType;
	mediaType?: MediaHint;
}): Promise<never> {
	const endpoint = opts.baseUrl.replace(/\/$/, "");
	const headers = buildHeaders(opts.apiKey);

	if (opts.wait) {
		return await pollUntilDone({
			generateId: opts.generateId,
			endpoint,
			headers,
			timeoutMs: opts.timeoutMs,
			pollIntervalMs: opts.pollIntervalMs ?? 3000,
			outputSchema: opts.outputSchema,
			mediaType: opts.mediaType,
		});
	}

	const resp = await fetch(
		`${endpoint}?generateId=${encodeURIComponent(opts.generateId)}`,
		{
			headers,
		},
	);
	if (!resp.ok) {
		return failure("http_error", t().api.statusFetchFailed(resp.status));
	}
	const data = (await resp.json()) as PollResponse;
	return success("raw", data);
}

async function pollUntilDone(opts: {
	generateId: string;
	endpoint: string;
	headers: HeadersInit;
	timeoutMs: number;
	pollIntervalMs: number;
	outputSchema?: z.ZodType;
	mediaType?: MediaHint;
}): Promise<never> {
	const pollUrl = `${opts.endpoint}?generateId=${encodeURIComponent(opts.generateId)}`;
	const deadline = Date.now() + opts.timeoutMs;

	while (Date.now() < deadline) {
		await sleep(opts.pollIntervalMs);
		let resp: Response;
		try {
			resp = await fetch(pollUrl, { headers: opts.headers });
		} catch (err) {
			return failure("network_error", (err as Error).message);
		}
		if (!resp.ok) {
			return failure("http_error", t().api.pollFailed(resp.status));
		}
		const data = (await resp.json()) as PollResponse;
		const status = data.status;

		if (status === "completed") {
			emitResult(data.result, opts.outputSchema, opts.mediaType);
		}
		if (status === "failed") {
			return failure("task_failed", data.error ?? "task failed", {
				generateId: opts.generateId,
			});
		}
		debug("polling", { status, generateId: opts.generateId });
		heartbeat();
	}

	return failure(
		"timeout",
		t().api.taskDidNotComplete(Math.round(opts.timeoutMs / 1000)),
		{ generateId: opts.generateId },
	);
}
