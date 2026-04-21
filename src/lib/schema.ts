import { z } from "zod";

export type FieldMediaType = "image" | "video" | "audio";
export const FILE_META_TYPES: ReadonlySet<string> = new Set<FieldMediaType>([
	"image",
	"video",
	"audio",
]);

export type SchemaCondition = {
	field: string;
	operator: "empty" | "notEmpty" | "equals" | "notEquals";
	value?: unknown;
};

export type SchemaConditionGroup =
	| SchemaCondition
	| { all: SchemaCondition[] }
	| { any: SchemaCondition[] };

export type FieldMeta = {
	type?: string;
	showWhen?: SchemaConditionGroup;
	hideWhen?: SchemaConditionGroup;
	hidden?: boolean;
};

export type FieldDescriptor = {
	key: string;
	required: boolean;
	isArray: boolean;
	mediaType?: FieldMediaType;
	description: string;
	enumChoices?: string[];
	defaultValue?: unknown;
	maxItems?: number;
	showWhen?: SchemaConditionGroup;
	hideWhen?: SchemaConditionGroup;
};

const JSON_SCHEMA_TYPES: ReadonlySet<string> = new Set([
	"string",
	"number",
	"integer",
	"boolean",
	"object",
	"array",
	"null",
]);

export function unwrap(schema: unknown): z.ZodTypeAny {
	let curr: any = schema;
	while (
		curr instanceof z.ZodOptional ||
		curr instanceof z.ZodNullable ||
		curr instanceof z.ZodDefault
	) {
		curr = curr.unwrap();
	}
	return curr as z.ZodTypeAny;
}

export function getShape(schema: unknown): Record<string, z.ZodTypeAny> {
	if (!schema) return {};
	const s = schema as any;
	if (s.shape) {
		return typeof s.shape === "function" ? s.shape() : s.shape;
	}
	if (s._def?.shape) {
		return typeof s._def.shape === "function" ? s._def.shape() : s._def.shape;
	}
	if (s._def?.schema) return getShape(s._def.schema);
	return {};
}

export function getMeta(schema: unknown): FieldMeta | undefined {
	const s = schema as any;
	return (s?.meta?.() ?? undefined) as FieldMeta | undefined;
}

export function isOptional(schema: unknown): boolean {
	return (
		schema instanceof z.ZodOptional ||
		schema instanceof z.ZodDefault ||
		schema instanceof z.ZodNullable
	);
}

export function getDefaultValue(schema: unknown): unknown {
	let curr: any = schema;
	while (curr) {
		if (curr instanceof z.ZodDefault) {
			const def = curr.def?.defaultValue ?? curr._def?.defaultValue;
			return typeof def === "function" ? def() : def;
		}
		if (curr instanceof z.ZodOptional || curr instanceof z.ZodNullable) {
			curr = curr.unwrap?.() ?? curr._def?.innerType;
			continue;
		}
		return undefined;
	}
	return undefined;
}

export function getEnumOptions(schema: unknown): string[] | undefined {
	const base = unwrap(schema) as any;
	if (base instanceof z.ZodEnum) {
		const opts = base.options;
		if (Array.isArray(opts)) return opts.map(String);
	}
	return undefined;
}

function getArrayMaxItems(schema: unknown): number | undefined {
	const base = unwrap(schema) as any;
	if (!(base instanceof z.ZodArray)) return undefined;
	const checks = base._def?.checks || base.def?.checks;
	if (!Array.isArray(checks)) return undefined;
	for (const c of checks as any[]) {
		if (c?.kind === "max" && typeof c.value === "number") return c.value;
		if (c?._zod?.def?.check === "max_length") return c._zod.def.maximum;
	}
	return undefined;
}

function isStringLike(schema: unknown): boolean {
	const base = unwrap(schema) as any;
	if (!base) return false;
	// Zod 4 splits string formats into distinct classes: ZodString, ZodURL, ZodEmail,
	// ZodUUID, etc. Match by def.type which is the underlying JS String constructor
	// for all of them, with an instanceof fallback for ZodString proper.
	if (base instanceof z.ZodString) return true;
	const defType = base._def?.type ?? base.def?.type;
	if (defType === String) return true;
	if (typeof defType === "string" && defType === "string") return true;
	return false;
}

export function describeField(
	key: string,
	schema: z.ZodTypeAny,
): FieldDescriptor {
	const meta = getMeta(schema);
	const base = unwrap(schema) as any;
	const isArray = base instanceof z.ZodArray;
	// mediaType only applies when the leaf value is a string (URL / path / data URI).
	// Some schemas tag array-of-objects fields with type:"video" purely for UI
	// grouping — skip those so we don't try to base64-encode object payloads.
	const leafSchema: unknown = isArray
		? (base.element ?? base._def?.element)
		: schema;
	const itemIsString = isStringLike(leafSchema);
	const mediaType =
		meta?.type && FILE_META_TYPES.has(meta.type) && itemIsString
			? (meta.type as FieldMediaType)
			: undefined;
	const enumChoices = getEnumOptions(schema);
	const defaultValue = getDefaultValue(schema);
	return {
		key,
		required: !isOptional(schema),
		isArray,
		mediaType,
		description:
			(schema as any)?.description || (schema as any)?._def?.description || key,
		enumChoices,
		defaultValue,
		maxItems: getArrayMaxItems(schema),
		showWhen: meta?.showWhen,
		hideWhen: meta?.hideWhen,
	};
}

export function describeSchema(schema: unknown): FieldDescriptor[] {
	const shape = getShape(schema);
	return Object.entries(shape).map(([key, field]) => describeField(key, field));
}

export function toJsonSchema(schema: z.ZodType): unknown {
	const out = z.toJSONSchema(schema as any) as any;
	return sanitizeJsonSchema(out);
}

function sanitizeJsonSchema(node: any): any {
	if (!node || typeof node !== "object") return node;
	if (typeof node.type === "string" && !JSON_SCHEMA_TYPES.has(node.type)) {
		node["x-ai-type"] = node.type;
		delete node.type;
	}
	if (node.properties) {
		for (const k of Object.keys(node.properties)) {
			sanitizeJsonSchema(node.properties[k]);
		}
	}
	if (node.items) sanitizeJsonSchema(node.items);
	for (const k of ["anyOf", "oneOf", "allOf"]) {
		if (Array.isArray(node[k])) node[k].forEach(sanitizeJsonSchema);
	}
	return node;
}

/**
 * Infer the result kind declared by an output schema.
 * Matches ToolTaskResult union (urls | text | shapes) in lib/types.ts.
 */
export function inferOutputKind(
	schema: unknown,
): "urls" | "text" | "shapes" | "raw" {
	const shape = getShape(schema);
	if ("urls" in shape) return "urls";
	if ("shapes" in shape) return "shapes";
	if ("text" in shape) return "text";
	return "raw";
}
