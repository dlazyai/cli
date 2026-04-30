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

export type OutputKind = "urls" | "text" | "shapes" | "raw";

// ---------------------------------------------------------------------------
// JSON Schema is the single source of truth. The CLI receives JSON Schema
// from the server-side manifest and walks it to derive field metadata.
// ---------------------------------------------------------------------------

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

function resolveRef(
	root: JsonSchemaNode,
	ref: string,
): JsonSchemaNode | undefined {
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

export function describeSchema(jsonSchema: unknown): FieldDescriptor[] {
	if (!jsonSchema || typeof jsonSchema !== "object") return [];
	const root = jsonSchema as JsonSchemaNode;
	const objectNode = pickObjectNode(root, root);
	if (!objectNode?.properties) return [];
	const required = new Set<string>(
		Array.isArray(objectNode.required) ? objectNode.required : [],
	);
	return Object.entries(objectNode.properties)
		.filter(([, node]) => {
			const resolved = deref(node, root);
			return (resolved as Record<string, unknown>).hidden !== true;
		})
		.map(([key, node]) =>
			describeFieldFromJson(key, node, required.has(key), root),
		);
}

/**
 * Infer the result kind from an output JSON Schema's top-level property names.
 * Matches ToolTaskResult union (urls | text | shapes).
 */
export function inferOutputKind(jsonSchema: unknown): OutputKind {
	if (!jsonSchema || typeof jsonSchema !== "object") return "raw";
	const root = jsonSchema as JsonSchemaNode;
	const objectNode = pickObjectNode(root, root);
	const keys = Object.keys(objectNode?.properties ?? {});
	if (keys.includes("urls")) return "urls";
	if (keys.includes("shapes")) return "shapes";
	if (keys.includes("text")) return "text";
	return "raw";
}

// ---------------------------------------------------------------------------
// Output schema → human-readable outline (used by `--help` text so users see
// the shape of the data a tool returns).
// ---------------------------------------------------------------------------

function summarizeType(node: JsonSchemaNode, root: JsonSchemaNode): string {
	const n = deref(node, root);
	if (Array.isArray(n.enum) && n.enum.length > 0) {
		return n.enum.map((v) => JSON.stringify(v)).join(" | ");
	}
	if (n.type === "array") {
		const items = Array.isArray(n.items) ? n.items[0] : n.items;
		const inner = items ? summarizeType(items as JsonSchemaNode, root) : "any";
		return `${inner}[]`;
	}
	if (n.type === "object" || n.properties) return "object";
	if (typeof n.type === "string") return n.type;
	if (Array.isArray(n.type)) return n.type.join(" | ");
	if (Array.isArray(n.anyOf) || Array.isArray(n.oneOf)) return "union";
	return "any";
}

function walkOutputNode(
	node: JsonSchemaNode,
	root: JsonSchemaNode,
	depth: number,
	maxDepth: number,
	excludeKeys: ReadonlySet<string>,
): string[] {
	if (depth >= maxDepth) return [];
	const obj = pickObjectNode(node, root);
	if (!obj?.properties) return [];
	const required = new Set<string>(
		Array.isArray(obj.required) ? obj.required : [],
	);
	const lines: string[] = [];
	const indent = "  ".repeat(depth);
	for (const [key, raw] of Object.entries(obj.properties)) {
		if (excludeKeys.has(key)) continue;
		const child = deref(raw as JsonSchemaNode, root);
		const opt = required.has(key) ? "" : "?";
		const summary = summarizeType(child, root);
		const desc =
			typeof child.description === "string" && child.description.length > 0
				? ` — ${child.description}`
				: "";
		lines.push(`${indent}${key}${opt}: ${summary}${desc}`);

		if (
			child.properties ||
			Array.isArray(child.allOf) ||
			Array.isArray(child.anyOf) ||
			Array.isArray(child.oneOf)
		) {
			lines.push(
				...walkOutputNode(child, root, depth + 1, maxDepth, excludeKeys),
			);
		} else if (child.type === "array") {
			const items = Array.isArray(child.items) ? child.items[0] : child.items;
			if (items) {
				const itemsResolved = deref(items as JsonSchemaNode, root);
				if (
					itemsResolved.properties ||
					Array.isArray(itemsResolved.allOf) ||
					Array.isArray(itemsResolved.anyOf) ||
					Array.isArray(itemsResolved.oneOf)
				) {
					lines.push(
						...walkOutputNode(
							itemsResolved,
							root,
							depth + 1,
							maxDepth,
							excludeKeys,
						),
					);
				}
			}
		}
	}
	return lines;
}

export type DescribeOutputOptions = {
	maxDepth?: number;
	/**
	 * Property names to omit at any depth. Used to hide fields that are
	 * meaningless to CLI consumers (e.g. canvas-render coords on shape outputs).
	 */
	excludeKeys?: ReadonlySet<string>;
};

/**
 * Walk an output JSON Schema and return an indented outline of its fields.
 * Each line is "key[?]: type — description". Useful for printing after
 * commander's `--help` so users can see the response shape inline.
 */
export function describeOutputSchema(
	jsonSchema: unknown,
	options: DescribeOutputOptions = {},
): string[] {
	if (!jsonSchema || typeof jsonSchema !== "object") return [];
	const root = jsonSchema as JsonSchemaNode;
	const maxDepth = options.maxDepth ?? 4;
	const excludeKeys = options.excludeKeys ?? new Set<string>();
	return walkOutputNode(root, root, 0, maxDepth, excludeKeys);
}
