import { type Command, Option } from "commander";
import type { AIModelConfig } from "../../../../config/modal.config";
import { createTranslator, getAiModels } from "../../../../config/modal.config";
import enModelsMessages from "../../../../messages/en-US/Models.json";
import zhModelsMessages from "../../../../messages/zh-CN/Models.json";
import { apiPostRun, apiStatus } from "../lib/api";
import {
	debug,
	failure,
	log,
	setVerbose,
	success,
	usageError,
} from "../lib/envelope";
import {
	buildInput,
	loadJsonInput,
	resolveMediaFields,
	validateInput,
} from "../lib/input";
import {
	describeSchema,
	type FieldDescriptor,
	inferOutputKind,
	toJsonSchema,
} from "../lib/schema";
import { getLocale, t } from "../messages";
import { isHeadless, resolveApiKey } from "../utils/config";

const MODELS_MESSAGES_BY_LOCALE = {
	"en-US": enModelsMessages,
	"zh-CN": zhModelsMessages,
} as const;

function getModelsTranslator() {
	const locale = getLocale();
	const messages =
		MODELS_MESSAGES_BY_LOCALE[locale] ?? MODELS_MESSAGES_BY_LOCALE["en-US"];
	return createTranslator(messages as Record<string, any>);
}

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
	const models = getAiModels(getModelsTranslator());
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
	const url =
		globals.baseUrl || process.env.DLAZY_BASE_URL || "https://dlazy.com";
	return url.replace(/\/+$/, "");
}

async function requireApiKey(globals: GlobalOptions): Promise<string> {
	const key = await resolveApiKey(globals.apiKey, {
		interactive: !isHeadless(),
	});
	if (!key) {
		return failure("no_api_key", t().auth.noApiKey);
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
	if ("not" in c) {
		const inner = describeCondition(c.not);
		return inner ? `!(${inner})` : undefined;
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
	if (field.dynamicEnum) {
		const parts = Object.entries(field.dynamicEnum.groups).map(
			([groupKey, opts]) => {
				const pairs = opts.map((o) => `${o.id} (${o.name})`).join(", ");
				return `${field.dynamicEnum!.dependsOn}=${groupKey}: ${pairs}`;
			},
		);
		desc += ` [options depend on --${field.dynamicEnum.dependsOn}; ${parts.join("; ")}]`;
	}
	const showWhen = describeCondition(field.showWhen);
	if (showWhen) desc += ` [only when ${showWhen}]`;
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
		// For dynamic enums we keep the full grouped listing in the description
		// (with id→name and per-group validity) and skip commander's flat
		// (choices: ...) footer which would just repeat the raw ids.
		if (field.enumChoices && !field.isArray && !field.dynamicEnum) {
			option.choices(field.enumChoices);
		}
		cmd.addOption(option);
	}

	cmd
		.option("--input <spec>", t().tools.runInputOption)
		.option("--dry-run", t().tools.runDryRunOption)
		.option("--no-wait", t().tools.runNoWaitOption)
		.option(
			"--timeout <seconds>",
			t().tools.runTimeoutOption,
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

		const apiKey = await requireApiKey(globals);
		const baseUrl = getBaseUrl(globals);

		const resolvedInput = await resolveMediaFields(rawInput, fields, {
			apiKey,
			baseUrl,
		});

		const validation = validateInput(config.inputSchema, resolvedInput);
		if (!validation.ok) {
			return usageError(t().tools.inputValidationFailed, validation.issues);
		}

		if (globals.dryRun) {
			const cost = config.costs
				? await safeEstimate(() => config.costs(resolvedInput))
				: null;
			const durationEstimate = config.durationEstimation
				? await safeEstimate(() => config.durationEstimation!(resolvedInput))
				: null;
			return success("raw", {
				dryRun: true,
				model: modelId,
				input: resolvedInput,
				estimatedCostCredits: cost,
				estimatedDurationSeconds: durationEstimate,
			});
		}

		const cost = config.costs
			? await safeEstimate(() => config.costs(resolvedInput))
			: null;
		const durationEstimate = config.durationEstimation
			? await safeEstimate(() => config.durationEstimation!(resolvedInput))
			: null;

		if (cost !== null) log(t().tools.estimatedCost(cost));
		if (durationEstimate !== null)
			log(t().tools.estimatedDuration(durationEstimate));

		const timeoutSeconds = Number(globals.timeout ?? DEFAULT_TIMEOUT_SECONDS);
		const shouldWait = globals.wait !== false;

		await apiPostRun({
			apiKey,
			baseUrl: `${baseUrl}/api/ai/tool`,
			modelId,
			input: resolvedInput,
			organizationId: globals.organizationId,
			projectId: globals.projectId,
			outputSchema: config.outputSchema,
			mediaType: config.type,
			wait: shouldWait,
			timeoutMs: timeoutSeconds * 1000,
		});
	});
}

function registerToolsNamespace(program: Command) {
	const msgs = t();
	const tools = program
		.command("tools")
		.description(msgs.tools.namespaceDescription);

	tools
		.command("list")
		.description(msgs.tools.listDescription)
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
		.description(msgs.tools.describeDescription)
		.action((name: string) => {
			const found = findByCliName(name);
			if (!found) {
				return failure(
					"tool_not_found",
					t().tools.toolNotFound(name),
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
						dynamicEnum: f.dynamicEnum ?? null,
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
	const msgs = t();
	program
		.command("status <generateId>")
		.description(msgs.tools.statusDescription)
		.option("--wait", msgs.tools.statusWaitOption)
		.option(
			"--timeout <seconds>",
			msgs.tools.statusTimeoutOption,
			String(DEFAULT_TIMEOUT_SECONDS),
		)
		.option("--tool <cli_name>", msgs.tools.statusToolOption)
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
			let mediaType: AIModelConfig["type"] | undefined;
			if (globals.tool) {
				const found = findByCliName(globals.tool);
				outputSchema = found?.config.outputSchema;
				mediaType = found?.config.type;
			}
			await apiStatus({
				apiKey,
				baseUrl: `${baseUrl}/api/ai/tool`,
				generateId,
				wait: Boolean(globals.wait),
				timeoutMs: timeoutSeconds * 1000,
				outputSchema,
				mediaType,
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
