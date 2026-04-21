import { type Command, Option } from "commander";
import type { AIModelConfig } from "../../../../config/modal.config";
import { getAiModels } from "../../../../config/modal.config";
import { apiPostRun, apiStatus } from "../lib/api";
import {
	debug,
	failure,
	log,
	setVerbose,
	success,
	usageError,
} from "../lib/envelope";
import { buildInput, loadJsonInput, validateInput } from "../lib/input";
import {
	describeSchema,
	type FieldDescriptor,
	inferOutputKind,
	toJsonSchema,
} from "../lib/schema";
import { isHeadless, resolveApiKey } from "../utils/config";

const SKIPPED_CLI_NAMES = new Set<string>(["qwen3.6-plus"]);

const DEFAULT_TIMEOUT_SECONDS = 30 * 60;

type GlobalOptions = {
	apiKey?: string;
	baseUrl?: string;
	verbose?: boolean;
	organizationId?: string;
	projectId?: string;
};

function listCliModels(): Array<[string, AIModelConfig]> {
	const models = getAiModels();
	const out: Array<[string, AIModelConfig]> = [];
	for (const [id, cfg] of Object.entries(models)) {
		if (!cfg.cli_name) continue;
		if (SKIPPED_CLI_NAMES.has(cfg.cli_name)) continue;
		out.push([id, cfg]);
	}
	return out;
}

function findByCliName(
	name: string,
): { id: string; config: AIModelConfig } | undefined {
	for (const [id, config] of listCliModels()) {
		if (config.cli_name === name) return { id, config };
	}
	return undefined;
}

function getBaseUrl(globals: GlobalOptions): string {
	return (
		globals.baseUrl ||
		process.env.DLAZY_BASE_URL ||
		"https://dlazy.com/api/ai/tool"
	);
}

async function requireApiKey(globals: GlobalOptions): Promise<string> {
	const key = await resolveApiKey(globals.apiKey, {
		interactive: !isHeadless(),
	});
	if (!key) {
		return failure(
			"no_api_key",
			"No API key available. Pass --api-key, set DLAZY_API_KEY, or run `dlazy login` in an interactive shell.",
		);
	}
	return key;
}

function describeCondition(cond: unknown): string | undefined {
	if (!cond || typeof cond !== "object") return undefined;
	const c = cond as any;
	if ("all" in c && Array.isArray(c.all)) {
		return c.all.map(describeCondition).filter(Boolean).join(" && ");
	}
	if ("any" in c && Array.isArray(c.any)) {
		return c.any.map(describeCondition).filter(Boolean).join(" || ");
	}
	if (c.operator === "equals") return `${c.field}=${JSON.stringify(c.value)}`;
	if (c.operator === "notEquals")
		return `${c.field}!=${JSON.stringify(c.value)}`;
	if (c.operator === "empty") return `${c.field} is empty`;
	if (c.operator === "notEmpty") return `${c.field} non-empty`;
	return undefined;
}

function buildFlagDescription(field: FieldDescriptor): string {
	let desc = field.description;
	if (field.mediaType) desc += ` [${field.mediaType}: url or local path]`;
	// Enum choices are rendered by commander's Option.choices() — don't repeat.
	if (field.maxItems !== undefined) desc += ` (max ${field.maxItems})`;
	if (field.defaultValue !== undefined && field.defaultValue !== null) {
		const d = Array.isArray(field.defaultValue)
			? field.defaultValue.length === 0
				? null
				: JSON.stringify(field.defaultValue)
			: field.defaultValue;
		if (d !== null) desc += ` [default: ${d}]`;
	}
	const showWhen = describeCondition(field.showWhen);
	if (showWhen) desc += ` [only when ${showWhen}]`;
	const hideWhen = describeCondition(field.hideWhen);
	if (hideWhen) desc += ` [hidden when ${hideWhen}]`;
	return desc;
}

async function safeEstimate(fn: () => Promise<number>): Promise<number | null> {
	try {
		return await fn();
	} catch (err) {
		debug("estimate failed", (err as Error).message);
		return null;
	}
}

function registerRunCommand(
	program: Command,
	modelId: string,
	config: AIModelConfig,
) {
	const cliName = config.cli_name!;
	const fields = describeSchema(config.inputSchema);

	const cmd = program
		.command(cliName)
		.description(`[${config.type}] ${config.description}`);

	for (const field of fields) {
		const spec = field.isArray ? `<${field.key}...>` : `<${field.key}>`;
		const option = new Option(
			`--${field.key} ${spec}`,
			buildFlagDescription(field),
		);
		if (field.enumChoices && !field.isArray) {
			option.choices(field.enumChoices);
		}
		cmd.addOption(option);
	}

	cmd
		.option(
			"--input <spec>",
			"JSON payload: inline string, @file, or - (stdin)",
		)
		.option("--dry-run", "Print payload + cost estimate without calling API")
		.option("--no-wait", "Return generateId immediately for async tasks")
		.option(
			"--timeout <seconds>",
			"Max seconds to wait for async completion",
			String(DEFAULT_TIMEOUT_SECONDS),
		);

	cmd.action(async (opts, cmdInstance) => {
		const globals = cmdInstance.optsWithGlobals() as GlobalOptions & {
			input?: string;
			dryRun?: boolean;
			wait?: boolean;
			timeout?: string;
		};

		if (globals.verbose) setVerbose(true);

		const explicitInput =
			typeof globals.input === "string"
				? await loadJsonInput(globals.input)
				: undefined;

		const rawInput = buildInput({
			fields,
			flagValues: opts as Record<string, unknown>,
			explicitInput,
		});

		const validation = validateInput(config.inputSchema, rawInput);
		if (!validation.ok) {
			return usageError("input validation failed", validation.issues);
		}

		const cost = config.costs
			? await safeEstimate(() => config.costs(rawInput))
			: null;
		const durationEstimate = config.durationEstimation
			? await safeEstimate(() => config.durationEstimation!(rawInput))
			: null;

		if (globals.dryRun) {
			return success("raw", {
				dryRun: true,
				model: modelId,
				input: rawInput,
				estimatedCostCredits: cost,
				estimatedDurationSeconds: durationEstimate,
			});
		}

		const apiKey = await requireApiKey(globals);
		const baseUrl = getBaseUrl(globals);

		if (cost !== null) log(`estimated cost: ${cost} credits`);
		if (durationEstimate !== null)
			log(`estimated duration: ${durationEstimate}s`);

		const timeoutSeconds = Number(globals.timeout ?? DEFAULT_TIMEOUT_SECONDS);
		const shouldWait = globals.wait !== false;

		await apiPostRun({
			apiKey,
			baseUrl,
			modelId,
			input: rawInput,
			organizationId: globals.organizationId,
			projectId: globals.projectId,
			outputSchema: config.outputSchema,
			wait: shouldWait,
			timeoutMs: timeoutSeconds * 1000,
		});
	});
}

function registerToolsNamespace(program: Command) {
	const tools = program
		.command("tools")
		.description("Discover available AI tools");

	tools
		.command("list")
		.description("List all tools exposed by the CLI")
		.action(() => {
			const list = listCliModels().map(([id, cfg]) => ({
				cli_name: cfg.cli_name!,
				id,
				type: cfg.type,
				runMode: cfg.runMode,
				asynchronous: Boolean(cfg.asynchronous),
				tier: cfg.tier ?? null,
				description: cfg.description,
			}));
			success("raw", { tools: list });
		});

	tools
		.command("describe <name>")
		.description("Emit full metadata + JSON schema for a single tool")
		.action((name: string) => {
			const found = findByCliName(name);
			if (!found) {
				return failure(
					"tool_not_found",
					`no tool with cli_name '${name}'`,
					{ availableTools: listCliModels().map(([_, c]) => c.cli_name) },
					2,
				);
			}
			const { id, config } = found;
			const fields = describeSchema(config.inputSchema);
			success("raw", {
				cli_name: config.cli_name!,
				id,
				type: config.type,
				description: config.description,
				runMode: config.runMode,
				asynchronous: Boolean(config.asynchronous),
				tier: config.tier ?? null,
				input: {
					fields: fields.map((f) => ({
						key: f.key,
						required: f.required,
						isArray: f.isArray,
						mediaType: f.mediaType ?? null,
						description: f.description,
						enumChoices: f.enumChoices ?? null,
						defaultValue: f.defaultValue ?? null,
						maxItems: f.maxItems ?? null,
						showWhen: f.showWhen ?? null,
						hideWhen: f.hideWhen ?? null,
					})),
					jsonSchema: toJsonSchema(config.inputSchema),
				},
				output: config.outputSchema
					? {
							kind: inferOutputKind(config.outputSchema),
							jsonSchema: toJsonSchema(config.outputSchema),
						}
					: null,
			});
		});
}

function registerStatusCommand(program: Command) {
	program
		.command("status <generateId>")
		.description("Query or wait on an async task by generateId")
		.option("--wait", "Poll until completion")
		.option(
			"--timeout <seconds>",
			"Max seconds to wait (with --wait)",
			String(DEFAULT_TIMEOUT_SECONDS),
		)
		.option(
			"--tool <cli_name>",
			"Use this tool's outputSchema for typed result parsing",
		)
		.action(async (generateId: string, _opts, cmdInstance) => {
			const globals = cmdInstance.optsWithGlobals() as GlobalOptions & {
				wait?: boolean;
				timeout?: string;
				tool?: string;
			};
			if (globals.verbose) setVerbose(true);
			const apiKey = await requireApiKey(globals);
			const baseUrl = getBaseUrl(globals);
			const timeoutSeconds = Number(globals.timeout ?? DEFAULT_TIMEOUT_SECONDS);
			let outputSchema: AIModelConfig["outputSchema"] | undefined;
			if (globals.tool) {
				const found = findByCliName(globals.tool);
				outputSchema = found?.config.outputSchema;
			}
			await apiStatus({
				apiKey,
				baseUrl,
				generateId,
				wait: Boolean(globals.wait),
				timeoutMs: timeoutSeconds * 1000,
				outputSchema,
			});
		});
}

export function registerToolCommands(program: Command) {
	registerToolsNamespace(program);
	registerStatusCommand(program);
	for (const [modelId, config] of listCliModels()) {
		registerRunCommand(program, modelId, config);
	}
}
