import { z } from "zod";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

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
	| { all: SchemaConditionGroup[] }
	| { any: SchemaConditionGroup[] }
	| { not: SchemaConditionGroup };

export type DynamicEnumOption = { id: string; name: string };

export type DynamicEnumGroups = Record<string, readonly DynamicEnumOption[]>;

export type DynamicEnumInfo = {
	dependsOn: string;
	groups: DynamicEnumGroups;
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
	dynamicEnum?: DynamicEnumInfo;
};

// ---------------------------------------------------------------------------
// JSON Schema is the single source of truth. Everything below derives field
// metadata by walking the JSON Schema produced by Zod v4's `z.toJSONSchema`.
// ---------------------------------------------------------------------------

const JSON_SCHEMA_TYPES: ReadonlySet<string> = new Set([
	"string",
	"number",
	"integer",
	"boolean",
	"object",
	"array",
	"null",
]);

type JsonSchemaNode = Record<string, unknown> & {
	type?: string | string[];
	properties?: Record<string, JsonSchemaNode>;
	items?: JsonSchemaNode | JsonSchemaNode[];
	required?: string[];
	enum?: unknown[];
	default?: unknown;
	description?: string;
	maxItems?: number;
	$ref?: string;
	$defs?: Record<string, JsonSchemaNode>;
	definitions?: Record<string, JsonSchemaNode>;
	anyOf?: JsonSchemaNode[];
	oneOf?: JsonSchemaNode[];
	allOf?: JsonSchemaNode[];
};

export function toJsonSchema(schema: z.ZodType): unknown {
	const out = z.toJSONSchema(schema as any) as JsonSchemaNode;
	return sanitizeJsonSchema(out);
}

function sanitizeJsonSchema(node: unknown): unknown {
	if (!node || typeof node !== "object") return node;
	const n = node as JsonSchemaNode;
	if (typeof n.type === "string" && !JSON_SCHEMA_TYPES.has(n.type)) {
		(n as Record<string, unknown>)["x-ai-type"] = n.type;
		delete n.type;
	}
	if (n.properties) {
		for (const k of Object.keys(n.properties)) {
			sanitizeJsonSchema(n.properties[k]);
		}
	}
	if (n.items) {
		if (Array.isArray(n.items)) n.items.forEach(sanitizeJsonSchema);
		else sanitizeJsonSchema(n.items);
	}
	for (const k of ["anyOf", "oneOf", "allOf"] as const) {
		const arr = n[k];
		if (Array.isArray(arr)) arr.forEach(sanitizeJsonSchema);
	}
	return n;
}

function resolveRef(
	root: JsonSchemaNode,
	ref: string,
): JsonSchemaNode | undefined {
	// Handles "#/$defs/Foo" and "#/definitions/Foo"
	if (!ref.startsWith("#/")) return undefined;
	const parts = ref.slice(2).split("/");
	let cur: unknown = root;
	for (const p of parts) {
		if (!cur || typeof cur !== "object") return undefined;
		cur = (cur as Record<string, unknown>)[p];
	}
	return cur as JsonSchemaNode | undefined;
}

function deref(
	node: JsonSchemaNode,
	root: JsonSchemaNode,
	seen = new Set<string>(),
): JsonSchemaNode {
	if (!node.$ref) return node;
	if (seen.has(node.$ref)) return node;
	seen.add(node.$ref);
	const target = resolveRef(root, node.$ref);
	if (!target) return node;
	return deref({ ...target, ...node, $ref: undefined }, root, seen);
}

function pickObjectNode(
	node: JsonSchemaNode,
	root: JsonSchemaNode,
): JsonSchemaNode | undefined {
	const n = deref(node, root);
	if (n.properties) return n;
	// Some schemas wrap the object in an allOf/anyOf (e.g. with superRefine meta).
	for (const k of ["allOf", "anyOf", "oneOf"] as const) {
		const arr = n[k];
		if (!Array.isArray(arr)) continue;
		for (const child of arr) {
			const found = pickObjectNode(child, root);
			if (found) return found;
		}
	}
	return undefined;
}

function parseDynamicEnum(raw: unknown): DynamicEnumInfo | undefined {
	if (!raw || typeof raw !== "object") return undefined;
	const r = raw as { dependsOn?: unknown; groups?: unknown };
	if (typeof r.dependsOn !== "string") return undefined;
	if (!r.groups || typeof r.groups !== "object") return undefined;
	const groups: Record<string, readonly DynamicEnumOption[]> = {};
	for (const [k, v] of Object.entries(r.groups as Record<string, unknown>)) {
		if (!Array.isArray(v)) continue;
		const opts = v.filter(
			(o): o is DynamicEnumOption =>
				!!o &&
				typeof o === "object" &&
				typeof (o as { id?: unknown }).id === "string" &&
				typeof (o as { name?: unknown }).name === "string",
		);
		groups[k] = opts;
	}
	return { dependsOn: r.dependsOn, groups };
}

function describeFieldFromJson(
	key: string,
	rawNode: JsonSchemaNode,
	required: boolean,
	root: JsonSchemaNode,
): FieldDescriptor {
	const node = deref(rawNode, root);
	const isArray = node.type === "array";
	const leaf: JsonSchemaNode | undefined = isArray
		? (Array.isArray(node.items) ? node.items[0] : node.items) &&
			deref(
				(Array.isArray(node.items)
					? node.items[0]
					: node.items) as JsonSchemaNode,
				root,
			)
		: node;

	const leafType = leaf?.type;
	const isStringLeaf = leafType === "string";

	// Meta `{mediaType}` is attached to the field schema itself (which for
	// arrays is the outer node, not the items leaf). Only treat it as a file
	// input when the actual value is a string (url/path/data URI).
	const mediaTypeRaw =
		(node as Record<string, unknown>).mediaType ??
		(leaf as Record<string, unknown> | undefined)?.mediaType;
	const mediaType =
		typeof mediaTypeRaw === "string" &&
		FILE_META_TYPES.has(mediaTypeRaw) &&
		isStringLeaf
			? (mediaTypeRaw as FieldMediaType)
			: undefined;

	const enumChoices = Array.isArray(node.enum)
		? node.enum.map((v) => String(v))
		: undefined;

	const dynamicEnum = parseDynamicEnum(
		(node as Record<string, unknown>)["x-dynamicEnum"],
	);
	const combinedChoices =
		enumChoices ??
		(dynamicEnum
			? [
					...new Set(
						Object.values(dynamicEnum.groups).flatMap((opts) =>
							opts.map((o) => o.id),
						),
					),
				]
			: undefined);

	// A field with a default is effectively optional from the user's POV:
	// commander may auto-inject the default, and the server accepts omission.
	const hasDefault = Object.hasOwn(node, "default");
	const effectiveRequired = required && !hasDefault;

	const showWhen = (node as Record<string, unknown>).showWhen as
		| SchemaConditionGroup
		| undefined;

	return {
		key,
		required: effectiveRequired,
		isArray,
		mediaType,
		description:
			typeof node.description === "string" && node.description.length > 0
				? node.description
				: key,
		enumChoices: combinedChoices,
		defaultValue: hasDefault ? node.default : undefined,
		maxItems:
			typeof node.maxItems === "number" && isArray ? node.maxItems : undefined,
		showWhen,
		dynamicEnum,
	};
}

export function describeSchema(schema: unknown): FieldDescriptor[] {
	if (!schema) return [];
	const root = toJsonSchema(schema as z.ZodType) as JsonSchemaNode;
	const objectNode = pickObjectNode(root, root);
	if (!objectNode?.properties) return [];
	const required = new Set<string>(
		Array.isArray(objectNode.required) ? objectNode.required : [],
	);
	return Object.entries(objectNode.properties).map(([key, node]) =>
		describeFieldFromJson(key, node, required.has(key), root),
	);
}

/**
 * Infer the result kind declared by an output schema, by looking at the
 * generated JSON Schema's top-level property names.
 * Matches ToolTaskResult union (urls | text | shapes) in lib/types.ts.
 */
export function inferOutputKind(
	schema: unknown,
): "urls" | "text" | "shapes" | "raw" {
	if (!schema) return "raw";
	const root = toJsonSchema(schema as z.ZodType) as JsonSchemaNode;
	const objectNode = pickObjectNode(root, root);
	const keys = Object.keys(objectNode?.properties ?? {});
	if (keys.includes("urls")) return "urls";
	if (keys.includes("shapes")) return "shapes";
	if (keys.includes("text")) return "text";
	return "raw";
}
