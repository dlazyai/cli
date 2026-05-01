import * as fs from "node:fs";
import { type Command, Option } from "commander";
import {
	apiEstimate,
	executeTool,
	executeToolBatch,
	getStatus,
} from "../lib/api";
import {
	debug,
	emitError,
	failure,
	log,
	SdkError,
	setVerbose,
	success,
} from "../lib/envelope";
import { buildInput, resolveMediaFields, resolveRefs } from "../lib/input";
import { loadManifest, type ManifestTool } from "../lib/manifest";
import { jsonResult } from "../lib/output";
import {
	describeOutputSchema,
	describeSchema,
	type FieldDescriptor,
	inferOutputKind,
} from "../lib/schema";
import { getLocale, t } from "../messages";
import { peekFlagValue } from "../utils/argv";
import { isHeadless, resolveApiKey } from "../utils/config";

const DEFAULT_TIMEOUT_SECONDS = 30 * 60;

/**
 * Tool types that produce content via remote inference and therefore make
 * sense to fan-out via `--batch`. Utility tools (`tool`) are excluded.
 */
const BATCHABLE_TOOL_TYPES: ReadonlySet<ManifestTool["type"]> = new Set([
	"image",
	"video",
	"audio",
	"text",
	"auto",
]);

type GlobalOptions = {
	apiKey?: string;
	baseUrl?: string;
	verbose?: boolean;
	organizationId?: string;
	projectId?: string;
};

/** Resolve the API base URL from override → env → default. */
function resolveBaseUrl(override?: string): string {
	const url = override || process.env.DLAZY_BASE_URL || "https://dlazy.com";
	return url.replace(/\/+$/, "");
}

function getBaseUrl(globals: GlobalOptions): string {
	return resolveBaseUrl(globals.baseUrl);
}

async function requireApiKey(globals: GlobalOptions): Promise<string> {
	const key = await resolveApiKey(globals.apiKey, {
		interactive: !isHeadless(),
	});
	if (!key) {
		throw new SdkError("no_api_key", t().auth.noApiKey);
	}
	return key;
}

function describeCondition(cond: unknown): string | undefined {
	if (!cond || typeof cond !== "object") return undefined;
	const c = cond as Record<string, unknown>;
	if (Array.isArray(c.all)) {
		return c.all.map(describeCondition).filter(Boolean).join(" && ");
	}
	if (Array.isArray(c.any)) {
		return c.any.map(describeCondition).filter(Boolean).join(" || ");
	}
	if ("not" in c) {
		const inner = describeCondition(c.not);
		return inner ? `!(${inner})` : undefined;
	}
	const field = typeof c.field === "string" ? c.field : "";
	if (c.operator === "equals") return `${field}=${JSON.stringify(c.value)}`;
	if (c.operator === "notEquals") return `${field}!=${JSON.stringify(c.value)}`;
	if (c.operator === "empty") return `${field} is empty`;
	if (c.operator === "notEmpty") return `${field} non-empty`;
	return undefined;
}

/**
 * Parse a --input value into a plain object.
 *
 *   - `@path.json` → read file, JSON.parse
 *   - inline JSON literal → JSON.parse
 *
 * Throws SdkError (exit 2) on file-not-found or bad JSON.
 */
function parseExplicitInput(raw: string | undefined): Record<string, unknown> {
	if (!raw) return {};
	const msgs = t();
	let text = raw;
	if (raw.startsWith("@")) {
		const p = raw.slice(1);
		if (!fs.existsSync(p)) {
			throw new SdkError(
				"input_file_not_found",
				msgs.tools.inputFileNotFound(p),
				undefined,
				2,
			);
		}
		text = fs.readFileSync(p, "utf8");
		try {
			const parsed = JSON.parse(text);
			if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
				throw new Error("expected JSON object");
			}
			return parsed as Record<string, unknown>;
		} catch (err) {
			throw new SdkError(
				"input_file_bad_json",
				msgs.tools.inputFileBadJson(p, (err as Error).message),
				undefined,
				2,
			);
		}
	}
	try {
		const parsed = JSON.parse(text);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			throw new Error("expected JSON object");
		}
		return parsed as Record<string, unknown>;
	} catch (err) {
		throw new SdkError(
			"input_file_bad_json",
			msgs.tools.inputFileBadJson("<inline>", (err as Error).message),
			undefined,
			2,
		);
	}
}

function buildFlagDescription(field: FieldDescriptor): string {
	let desc = field.description;
	if (field.mediaType) desc += ` [${field.mediaType}: url or local path]`;
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

// Canvas-only fields stripped from shape outputs and from the help-text
// schema outline — terminal consumers don't render to a canvas, so x/y/w/h
// are noise.
const SHAPE_HIDDEN_KEYS: ReadonlySet<string> = new Set(["x", "y", "w", "h"]);

function buildRunOutputHelp(tool: ManifestTool): string {
	const msgs = t();
	const lines: string[] = [
		"",
		msgs.tools.outputHeader,
		msgs.tools.outputEnvelope,
	];

	const kind = inferOutputKind(tool.outputJsonSchema);
	if (kind === "urls") {
		lines.push(msgs.tools.outputUrlsKind(tool.type));
	} else if (kind === "text") {
		lines.push(msgs.tools.outputTextKind);
	} else {
		// shapes kind is exposed as plain JSON in the CLI (no canvas concept).
		lines.push(msgs.tools.outputRawKind);
	}

	if (tool.asynchronous) {
		lines.push(msgs.tools.outputAsyncNote);
	}

	lines.push(msgs.tools.outputErrorEnvelope);

	// Only show the inner schema for non-trivial shapes — i.e. tools whose
	// output is `shapes` or a custom JSON payload (`raw`). Plain `urls` /
	// `text` tools have no useful detail beyond the outputs[] line above.
	if (kind === "shapes" || kind === "raw") {
		const schemaLines = describeOutputSchema(tool.outputJsonSchema, {
			excludeKeys: kind === "shapes" ? SHAPE_HIDDEN_KEYS : undefined,
		});
		if (schemaLines.length > 0) {
			lines.push("", msgs.tools.outputSchemaHeader);
			for (const line of schemaLines) {
				lines.push(`  ${line}`);
			}
		}
	}

	return lines.join("\n");
}

type RunCommandOptions = GlobalOptions & {
	dryRun?: boolean;
	wait?: boolean;
	timeout?: string;
	batch?: string;
	input?: string;
};

async function runToolAction(
	tool: ManifestTool,
	fields: FieldDescriptor[],
	isBatchable: boolean,
	opts: Record<string, unknown>,
	globals: RunCommandOptions,
) {
	if (globals.verbose) setVerbose(true);

	const explicitInput = parseExplicitInput(globals.input);
	const rawInput = buildInput({
		fields,
		flagValues: opts,
		explicitInput,
	});
	const refsResolved = await resolveRefs(rawInput, fields);
	const timeoutSeconds = Number(globals.timeout ?? DEFAULT_TIMEOUT_SECONDS);
	const batch = isBatchable
		? Math.max(1, Math.floor(Number(opts.batch ?? "1")) || 1)
		: 1;

	// Dry-run is hermetic: no network, no auth, no uploads. Echoes the raw
	// resolved input (local paths / data URLs are kept as-is).
	if (globals.dryRun) {
		return success(
			jsonResult(
				tool.cli_name,
				{
					dryRun: true,
					model: tool.id,
					input: refsResolved,
					batch,
					estimatedCostCredits: null,
					estimatedDurationSeconds: null,
				},
				tool.id,
			),
		);
	}

	const apiKey = await requireApiKey(globals);
	const baseUrl = getBaseUrl(globals);
	const resolvedInput = await resolveMediaFields(refsResolved, fields, {
		apiKey,
		baseUrl,
	});

	// Required-field check is enforced only on the live run path.
	for (const f of fields) {
		if (f.required && resolvedInput[f.key] === undefined) {
			throw new SdkError(
				"missing_field",
				`--${f.key} is required (no value, stdin reference, or default)`,
				undefined,
				2,
			);
		}
	}

	if (tool.hasCosts || tool.hasDurationEstimation) {
		const est = await apiEstimate({
			apiKey,
			baseUrl,
			modelId: tool.id,
			input: resolvedInput,
		});
		if (est.estimatedCostCredits !== null)
			log(t().tools.estimatedCost(est.estimatedCostCredits * batch));
		if (est.estimatedDurationSeconds !== null)
			log(t().tools.estimatedDuration(est.estimatedDurationSeconds));
	}

	const runOpts = {
		apiKey,
		baseUrl,
		tool,
		input: resolvedInput,
		organizationId: globals.organizationId,
		projectId: globals.projectId,
		wait: globals.wait !== false,
		timeoutMs: timeoutSeconds * 1000,
	};

	const result =
		batch > 1
			? await executeToolBatch({ ...runOpts, batch })
			: await executeTool(runOpts);
	success(result);
}

/**
 * For object-typed array items (e.g. `merge.videoOptions`,
 * `execute.shapes`), commander gives us strings — but the schema expects
 * structured objects. JSON-parse each value at flag time so users can
 * pass `--shapes '{"type":"image","props":{...}}'` directly.
 */
function isObjectArrayField(jsonSchema: unknown, key: string): boolean {
	if (!jsonSchema || typeof jsonSchema !== "object") return false;
	const props = (jsonSchema as { properties?: Record<string, unknown> })
		.properties;
	const node = props?.[key] as Record<string, unknown> | undefined;
	if (!node || node.type !== "array" || !node.items) return false;
	const items = (Array.isArray(node.items) ? node.items[0] : node.items) as
		| Record<string, unknown>
		| undefined;
	if (!items) return false;
	return Boolean(items.properties || items.type === "object");
}

function registerRunCommand(program: Command, tool: ManifestTool) {
	const fields = describeSchema(tool.inputJsonSchema);

	const cmd = program
		.command(tool.cli_name)
		.description(`[${tool.type}] ${tool.description}`);

	for (const field of fields) {
		// All flags are optional at the parser level — values may also flow in
		// from stdin via `-` / `@N` references. Required-ness is enforced after
		// reference resolution.
		const spec = field.isArray ? `[${field.key}...]` : `[${field.key}]`;
		const option = new Option(
			`--${field.key} ${spec}`,
			buildFlagDescription(field),
		);
		if (field.enumChoices && !field.isArray && !field.dynamicEnum) {
			option.choices(field.enumChoices);
		}
		if (isObjectArrayField(tool.inputJsonSchema, field.key)) {
			option.argParser((raw: string, prev?: unknown[]): unknown[] => {
				let parsed: unknown;
				try {
					parsed = JSON.parse(raw);
				} catch (err) {
					throw new SdkError(
						"invalid_input",
						t().tools.flagJsonParseFailed(field.key, (err as Error).message),
					);
				}
				return Array.isArray(prev) ? [...prev, parsed] : [parsed];
			});
		}
		cmd.addOption(option);
	}

	cmd
		.option("--dry-run", t().tools.runDryRunOption)
		.option("--no-wait", t().tools.runNoWaitOption)
		.option(
			"--timeout <seconds>",
			t().tools.runTimeoutOption,
			String(DEFAULT_TIMEOUT_SECONDS),
		)
		.option("--input <jsonOrFile>", t().tools.runInputOption);

	const isBatchable = BATCHABLE_TOOL_TYPES.has(tool.type);
	if (isBatchable) {
		cmd.option("--batch <n>", t().tools.runBatchOption, "1");
	}

	cmd.addHelpText("after", buildRunOutputHelp(tool));

	cmd.action(async (opts, cmdInstance) => {
		try {
			const globals = cmdInstance.optsWithGlobals() as RunCommandOptions;
			await runToolAction(
				tool,
				fields,
				isBatchable,
				opts as Record<string, unknown>,
				globals,
			);
		} catch (err) {
			emitError(err);
		}
	});
}

function registerToolsNamespace(program: Command, tools: ManifestTool[]) {
	const msgs = t();
	const ns = program
		.command("tools")
		.description(msgs.tools.namespaceDescription);

	ns.command("list")
		.description(msgs.tools.listDescription)
		.addHelpText(
			"after",
			["", msgs.tools.outputListHeader, msgs.tools.outputListShape].join("\n"),
		)
		.action(() => {
			success(
				jsonResult("tools", {
					tools: tools.map((cfg) => ({
						cli_name: cfg.cli_name,
						id: cfg.id,
						type: cfg.type,
						runMode: cfg.runMode,
						asynchronous: cfg.asynchronous,
						tier: cfg.tier,
						description: cfg.description,
					})),
				}),
			);
		});

	ns.command("describe <name>")
		.description(msgs.tools.describeDescription)
		.addHelpText(
			"after",
			[
				"",
				msgs.tools.outputDescribeHeader,
				msgs.tools.outputDescribeShape,
			].join("\n"),
		)
		.action((name: string) => {
			const found = tools.find((cfg) => cfg.cli_name === name);
			if (!found) {
				return failure(
					"tool_not_found",
					t().tools.toolNotFound(name),
					{ availableTools: tools.map((cfg) => cfg.cli_name) },
					2,
				);
			}
			const fields = describeSchema(found.inputJsonSchema);
			success(
				jsonResult("tools.describe", {
					cli_name: found.cli_name,
					id: found.id,
					type: found.type,
					description: found.description,
					runMode: found.runMode,
					asynchronous: found.asynchronous,
					tier: found.tier,
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
						jsonSchema: found.inputJsonSchema,
					},
					output: found.outputJsonSchema
						? {
								kind: inferOutputKind(found.outputJsonSchema),
								jsonSchema: found.outputJsonSchema,
							}
						: null,
				}),
			);
		});
}

function registerStatusCommand(program: Command, tools: ManifestTool[]) {
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
		.addHelpText("after", `\n${msgs.tools.outputStatusHeader}`)
		.action(async (generateId: string, _opts, cmdInstance) => {
			try {
				const globals = cmdInstance.optsWithGlobals() as GlobalOptions & {
					wait?: boolean;
					timeout?: string;
					tool?: string;
				};
				if (globals.verbose) setVerbose(true);
				const apiKey = await requireApiKey(globals);
				const baseUrl = getBaseUrl(globals);
				const timeoutSeconds = Number(
					globals.timeout ?? DEFAULT_TIMEOUT_SECONDS,
				);
				const found = globals.tool
					? tools.find((cfg) => cfg.cli_name === globals.tool)
					: undefined;
				const result = await getStatus({
					apiKey,
					baseUrl,
					tool: found,
					generateId,
					wait: Boolean(globals.wait),
					timeoutMs: timeoutSeconds * 1000,
				});
				success(result);
			} catch (err) {
				emitError(err);
			}
		});
}

export async function registerToolCommands(program: Command) {
	const baseUrl = resolveBaseUrl(peekFlagValue(process.argv, "base-url"));
	const manifest = await loadManifest(baseUrl, getLocale());
	debug("manifest loaded", { count: manifest.tools.length });

	registerToolsNamespace(program, manifest.tools);
	registerStatusCommand(program, manifest.tools);
	for (const tool of manifest.tools) {
		registerRunCommand(program, tool);
	}
}
