import type { z } from "zod";
import { sleep } from "../utils/utils";
import { debug, failure, heartbeat, log, success } from "./envelope";
import { inferOutputKind } from "./schema";

export type RunOptions = {
	apiKey: string;
	baseUrl: string;
	modelId: string;
	input: Record<string, unknown>;
	organizationId?: string;
	projectId?: string;
	outputSchema?: z.ZodType;
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

function emitResult(result: unknown, outputSchema?: z.ZodType): never {
	const schemaKind = outputSchema ? inferOutputKind(outputSchema) : "raw";
	if (outputSchema) {
		const parsed = outputSchema.safeParse(result);
		if (parsed.success) {
			return success(schemaKind, parsed.data);
		}
		debug("outputSchema parse failed", parsed.error.issues);
	}
	if (isUrlsOutput(result)) return success("urls", { urls: result.urls });
	if (isShapesOutput(result))
		return success("shapes", { shapes: result.shapes });
	if (isTextOutput(result)) return success("text", { text: result.text });
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

	log(`invoking ${opts.modelId}`);
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
		return failure(
			code,
			`request failed with status ${response.status}`,
			details,
		);
	}

	const json = (await response.json()) as PostResponse;
	const output = json.output;

	if (isGenerateIdOutput(output)) {
		if (!opts.wait) {
			return success("generateId", {
				generateId: output.generateId,
				status: output.status ?? "pending",
			});
		}
		log(`task submitted; polling ${output.generateId}`);
		return await pollUntilDone({
			generateId: output.generateId,
			endpoint,
			headers,
			timeoutMs: opts.timeoutMs,
			pollIntervalMs: opts.pollIntervalMs ?? 3000,
			outputSchema: opts.outputSchema,
		});
	}

	emitResult(output, opts.outputSchema);
}

export async function apiStatus(opts: {
	apiKey: string;
	baseUrl: string;
	generateId: string;
	wait: boolean;
	timeoutMs: number;
	pollIntervalMs?: number;
	outputSchema?: z.ZodType;
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
		});
	}

	const resp = await fetch(
		`${endpoint}?generateId=${encodeURIComponent(opts.generateId)}`,
		{
			headers,
		},
	);
	if (!resp.ok) {
		return failure("http_error", `status fetch failed (${resp.status})`);
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
			return failure("http_error", `poll failed (${resp.status})`);
		}
		const data = (await resp.json()) as PollResponse;
		const status = data.status;

		if (status === "completed") {
			emitResult(data.result, opts.outputSchema);
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
		`task did not complete within ${Math.round(opts.timeoutMs / 1000)}s`,
		{ generateId: opts.generateId },
	);
}
