import { version as CLI_VERSION } from "../../package.json";
import { t } from "../messages";
import { sleep } from "../utils/utils";
import { debug, heartbeat, log, SdkError } from "./envelope";
import type { ManifestTool } from "./manifest";
import {
	isGenerateIdOutput,
	mergeToolResults,
	type ToolResult,
	toToolResult,
} from "./output";

function readCliWarning(payload: unknown): string | null {
	if (!payload || typeof payload !== "object") return null;
	const value = (payload as { cliWarning?: unknown }).cliWarning;
	return typeof value === "string" && value.length > 0 ? value : null;
}

export type RunOptions = {
	apiKey: string;
	baseUrl: string;
	tool: ManifestTool;
	input: Record<string, unknown>;
	organizationId?: string;
	projectId?: string;
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

export type EstimateResult = {
	estimatedCostCredits: number | null;
	estimatedDurationSeconds: number | null;
};

export async function apiEstimate(opts: {
	apiKey: string;
	baseUrl: string;
	modelId: string;
	input: Record<string, unknown>;
}): Promise<EstimateResult> {
	const endpoint = `${opts.baseUrl.replace(/\/$/, "")}/api/ai/tool/estimate`;
	const resp = await fetch(endpoint, {
		method: "POST",
		headers: buildHeaders(opts.apiKey),
		body: JSON.stringify({ model: opts.modelId, input: opts.input }),
	});
	if (!resp.ok) {
		debug("estimate failed", resp.status);
		return { estimatedCostCredits: null, estimatedDurationSeconds: null };
	}
	const data = (await resp.json()) as Partial<EstimateResult>;
	return {
		estimatedCostCredits: data.estimatedCostCredits ?? null,
		estimatedDurationSeconds: data.estimatedDurationSeconds ?? null,
	};
}

function buildHeaders(apiKey: string): HeadersInit {
	return {
		Authorization: `Bearer ${apiKey}`,
		"Content-Type": "application/json",
		"X-CLI-Version": CLI_VERSION,
	};
}

/**
 * Submit a tool run and (optionally) wait for completion. Pure: returns a
 * ToolResult; throws SdkError on failure. CLI and SDK both call this.
 */
export async function executeTool(opts: RunOptions): Promise<ToolResult> {
	const endpoint = `${opts.baseUrl.replace(/\/$/, "")}/api/ai/tool`;
	const headers = buildHeaders(opts.apiKey);

	const body: Record<string, unknown> = {
		model: opts.tool.id,
		input: opts.input,
	};
	if (opts.organizationId) body.organizationId = opts.organizationId;
	if (opts.projectId) body.projectId = opts.projectId;

	log(t().api.invoking(opts.tool.id));
	debug("payload", body);

	let response: Response;
	try {
		response = await fetch(endpoint, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});
	} catch (err) {
		throw new SdkError("network_error", (err as Error).message);
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
		throw new SdkError(code, t().api.requestFailed(response.status), details);
	}

	const json = (await response.json()) as PostResponse & {
		cliWarning?: string;
	};
	const output = json.output;
	const initialWarning = readCliWarning(json);

	if (isGenerateIdOutput(output)) {
		if (!opts.wait) {
			return attachWarning(toToolResult(output, opts.tool), initialWarning);
		}
		log(t().api.taskSubmitted(output.generateId));
		const polled = await pollUntilDone({
			generateId: output.generateId,
			endpoint,
			headers,
			timeoutMs: opts.timeoutMs,
			pollIntervalMs: opts.pollIntervalMs ?? 3000,
		});
		log(t().api.generationCompleted);
		return attachWarning(
			toToolResult(polled.output, opts.tool),
			polled.cliWarning ?? initialWarning,
		);
	}

	log(t().api.generationCompleted);
	return attachWarning(toToolResult(output, opts.tool), initialWarning);
}

function attachWarning(
	result: ToolResult,
	warning: string | null,
): ToolResult {
	if (!warning) return result;
	return { ...result, warning };
}

/**
 * Run the same tool N times in parallel and merge their outputs into a single
 * ToolResult. Used by `--batch` (CLI) and `RunOptions.batch` (SDK).
 *
 * Failure semantics: any sub-run rejection rejects the whole batch
 * (Promise.all). Already-running peers continue executing on the server but
 * their results are discarded by the caller. There is no "best-effort" mode
 * — if you need partial success, fan out at the SDK level and handle errors
 * per-handle.
 */
export async function executeToolBatch(
	opts: RunOptions & { batch: number },
): Promise<ToolResult> {
	const n = Math.max(1, Math.floor(opts.batch));
	if (n === 1) return executeTool(opts);
	const runs = Array.from({ length: n }, () => executeTool(opts));
	const results = await Promise.all(runs);
	return mergeToolResults(results);
}

export type StatusOptions = {
	apiKey: string;
	baseUrl: string;
	tool?: ManifestTool;
	generateId: string;
	wait: boolean;
	timeoutMs: number;
	pollIntervalMs?: number;
};

/** Poll a generateId or fetch it once. Returns ToolResult; throws SdkError. */
export async function getStatus(opts: StatusOptions): Promise<ToolResult> {
	const endpoint = `${opts.baseUrl.replace(/\/$/, "")}/api/ai/tool`;
	const headers = buildHeaders(opts.apiKey);
	const tool = opts.tool ?? makeFallbackTool();

	if (opts.wait) {
		const polled = await pollUntilDone({
			generateId: opts.generateId,
			endpoint,
			headers,
			timeoutMs: opts.timeoutMs,
			pollIntervalMs: opts.pollIntervalMs ?? 3000,
		});
		return attachWarning(toToolResult(polled.output, tool), polled.cliWarning);
	}

	const resp = await fetch(
		`${endpoint}?generateId=${encodeURIComponent(opts.generateId)}`,
		{ headers },
	);
	if (!resp.ok) {
		throw new SdkError("http_error", t().api.statusFetchFailed(resp.status));
	}
	const data = (await resp.json()) as PollResponse & { cliWarning?: string };
	return attachWarning(toToolResult(data, tool), readCliWarning(data));
}

/**
 * `dlazy status <id>` doesn't always know which tool produced the id; this
 * fabricates a minimal record so toToolResult can still shape the response.
 */
function makeFallbackTool(): ManifestTool {
	return {
		id: "unknown",
		cli_name: "status",
		type: "tool",
		description: "",
		runMode: "task",
		asynchronous: true,
		tier: null,
		hasCosts: false,
		hasDurationEstimation: false,
		inputJsonSchema: null,
		outputJsonSchema: null,
	};
}

async function pollUntilDone(opts: {
	generateId: string;
	endpoint: string;
	headers: HeadersInit;
	timeoutMs: number;
	pollIntervalMs: number;
}): Promise<{ output: unknown; cliWarning: string | null }> {
	const pollUrl = `${opts.endpoint}?generateId=${encodeURIComponent(opts.generateId)}`;
	const deadline = Date.now() + opts.timeoutMs;
	let lastWarning: string | null = null;

	while (Date.now() < deadline) {
		await sleep(opts.pollIntervalMs);
		let resp: Response;
		try {
			resp = await fetch(pollUrl, { headers: opts.headers });
		} catch (err) {
			throw new SdkError("network_error", (err as Error).message);
		}
		if (!resp.ok) {
			throw new SdkError("http_error", t().api.pollFailed(resp.status));
		}
		const data = (await resp.json()) as PollResponse & {
			cliWarning?: string;
		};
		const warning = readCliWarning(data);
		if (warning) lastWarning = warning;
		const status = data.status;

		if (status === "completed") {
			return { output: data.result, cliWarning: lastWarning };
		}
		if (status === "failed") {
			throw new SdkError("task_failed", data.error ?? "task failed", {
				generateId: opts.generateId,
			});
		}
		debug("polling", { status, generateId: opts.generateId });
		heartbeat();
	}

	throw new SdkError(
		"timeout",
		t().api.taskDidNotComplete(Math.round(opts.timeoutMs / 1000)),
		{ generateId: opts.generateId },
	);
}
