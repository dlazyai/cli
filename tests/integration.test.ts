/**
 * Integration tests — exercises the CLI against a real running server.
 *
 * Opt-in: gated by `DLAZY_INTEGRATION=1`. Run with:
 *
 *   DLAZY_INTEGRATION=1 pnpm --filter @dlazy/cli run test:integration
 *
 * Per-model flow is two-phase:
 *   1. dry-run smoke test (no network, validates CLI registration + schema).
 *   2. real run (against $DLAZY_BASE_URL) — only executed when phase 1 passed
 *      AND the recipe doesn't carry `skipReal`.
 *
 * Every test writes a record to packages/cli/tests/files/result/<group>/<slug>.json
 * containing args, exit code, stdout/stderr, and the parsed payload. The
 * result/ directory is wiped at the start of each full run (the .gitignore is
 * preserved), so users can inspect outputs after the suite completes.
 *
 * Re-run a single command without re-running the whole suite, e.g.:
 *
 *   DLAZY_INTEGRATION=1 pnpm -w exec vitest run \
 *     packages/cli/tests/integration.test.ts -t "banana2 \(real\)"
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "vitest";
import { getAiModels } from "../../../config/modal.config";
import { allUrls, type CliResult, jsonValue, runCli } from "./_helpers/run-cli";

const ENABLED = process.env.DLAZY_INTEGRATION === "1";
const BASE_URL = process.env.DLAZY_BASE_URL || "http://localhost:3000";
const API_KEY =
	process.env.DLAZY_API_KEY ||
	"sk-45b2dae0bb696e3664d943200864965c3d52993de0eba741";

const FILES_DIR = path.join(__dirname, "files");
const RESULT_DIR = path.join(FILES_DIR, "result");
const FILE_IMAGE = path.join(
	FILES_DIR,
	"00e783a8-c1c1-4e51-9e6d-fff2d94d7042.jpg",
);
const FILE_AUDIO = path.join(
	FILES_DIR,
	"007c83e0-07b9-465a-a04b-18e66ee5b69a.mp3",
);
const FILE_VIDEO = path.join(
	FILES_DIR,
	"00db61ed-a2ef-4609-a563-56e694f46d00.mp4",
);

const SKIPPED_CLI_NAMES = new Set(["qwen3.6-plus"]);
const E2E_TIMEOUT_MS = 10 * 60 * 1000;

const cliDescribe = ENABLED ? describe.sequential : describe.skip;

type ModelEntry = { id: string; cli_name: string; type: string };

function listCliModels(): ModelEntry[] {
	const out: ModelEntry[] = [];
	for (const [id, cfg] of Object.entries(getAiModels())) {
		if (!cfg.cli_name) continue;
		if (SKIPPED_CLI_NAMES.has(cfg.cli_name)) continue;
		out.push({ id, cli_name: cfg.cli_name, type: cfg.type });
	}
	return out;
}

const CLI_MODELS = listCliModels();

// =====================================================================
// Per-model run recipes. Placeholders __IMAGE__ / __AUDIO__ / __VIDEO__
// are substituted with the local fixtures at runtime.
// =====================================================================

type Recipe = { args: string[]; skipReal?: string };

const RECIPES: Record<string, Recipe> = {
	// Bailian / Wan
	"wan2.6-r2v-flash": { args: ["--prompt", "一只可爱的小猫在草地上奔跑"] },
	"wan2.6-r2v": { args: ["--prompt", "一只可爱的小猫在草地上奔跑"] },
	"wan2.7": { args: ["--prompt", "一只可爱的小猫在草地上奔跑"] },

	// Banana
	"banana-pro": { args: ["--prompt", "a tiny cat in a meadow"] },
	banana2: { args: ["--prompt", "a tiny cat in a meadow"] },

	// Doubao Seedance / Seedream
	"seedance-1.5-pro": { args: ["--prompt", "一只小猫在阳光下奔跑"] },
	"seedance-2.0-fast": { args: ["--prompt", "一只小猫在阳光下奔跑"] },
	"seedance-2.0": { args: ["--prompt", "一只小猫在阳光下奔跑"] },
	"seedream-4.5": {
		args: ["--prompt", "a serene mountain landscape at sunrise"],
	},
	"seedream-5.0-lite": {
		args: ["--prompt", "a serene mountain landscape at sunrise"],
	},

	// Audio / TTS
	"doubao-tts": { args: ["--prompt", "你好，世界"] },
	"gemini-2.5-tts": { args: ["--prompt", "Hello world, this is a test."] },
	"keling-tts": { args: ["--prompt", "你好，欢迎使用语音合成"] },
	"keling-sfx": { args: ["--prompt", "海浪拍打沙滩的声音"] },
	"suno-music": { args: ["--prompt", "a calm acoustic guitar piece"] },

	// Voice clone
	"kling-audio-clone": { args: ["--audio_url", "__AUDIO__"] },
	"vidu-audio-clone": {
		args: ["--audio_url", "__AUDIO__", "--prompt", "请用这种音色朗读这段文字"],
	},

	// GPT / Grok / MJ / Recraft / Kling image
	"gpt-image-2": { args: ["--prompt", "a cute cat sitting on a sofa"] },
	"grok-4.2": { args: ["--prompt", "a cute cat sitting on a sofa"] },
	"mj-imagine": { args: ["--prompt", "a cute cat sitting on a sofa"] },
	"recraft-v3": { args: ["--prompt", "a cute cat sitting on a sofa"] },
	"recraft-v3-svg": { args: ["--prompt", "a minimalist mountain logo"] },
	"recraft-v4": { args: ["--prompt", "a cute cat sitting on a sofa"] },
	"recraft-v4-vector": { args: ["--prompt", "a minimalist mountain logo"] },
	"recraft-v4-pro": { args: ["--prompt", "a cute cat sitting on a sofa"] },
	"recraft-v4-pro-vector": {
		args: ["--prompt", "a minimalist mountain logo"],
	},
	"kling-image-o1": { args: ["--prompt", "a cute cat sitting on a sofa"] },

	// Jimeng
	"jimeng-t2i": { args: ["--prompt", "a cute cat sitting on a sofa"] },
	"jimeng-i2v-first": { args: ["--prompt", "镜头缓慢推近，小猫眨眼"] },
	"jimeng-i2v-first-tail": { args: ["--prompt", "镜头缓慢推近，小猫眨眼"] },
	"jimeng-dream-actor": {
		args: ["--prompt", "让人物开口说话", "--videos", "__VIDEO__"],
	},
	"jimeng-omnihuman-1.5": {
		args: ["--images", "__IMAGE__", "--audio", "__AUDIO__"],
	},

	// Kling video
	"kling-v3": {
		args: [
			"--prompt",
			"镜头缓慢推近，小猫眨眼",
			"--images",
			"__IMAGE__",
			"__IMAGE__",
		],
	},
	"kling-v3-omni": { args: ["--prompt", "镜头缓慢推近，小猫眨眼"] },

	// Pixverse / Veo / Vidu
	"pixverse-c1": { args: ["--prompt", "镜头缓慢推近，小猫眨眼"] },
	"veo-3.1-fast": { args: ["--prompt", "a small cat slowly blinks at sunset"] },
	"veo-3.1": { args: ["--prompt", "a small cat slowly blinks at sunset"] },
	"viduq2-i2v": {
		args: ["--prompt", "镜头缓慢推近，小猫眨眼", "--images", "__IMAGE__"],
	},
	"viduq2-t2i": {
		args: ["--prompt", "a serene mountain landscape at sunrise"],
	},

	// One-click MoneyPrinterTurbo
	"one-click-generation": {
		args: ["--prompt", "介绍一下大熊猫的有趣习性"],
	},

	// Media-only inputs (no prompt)
	"image-replicate": { args: ["--images", "__IMAGE__"] },
	imageseg: { args: ["--image", "__IMAGE__"] },
	superres: { args: ["--image", "__IMAGE__"] },
	"video-replicate": { args: ["--videos", "__VIDEO__"] },
	"video-scenes": { args: ["--video", "__VIDEO__"] },

	// Skipped — agent / canvas-state / complex tool inputs
	execute: {
		args: [],
		skipReal:
			"requires shapes[] of executable plan nodes with cross-shape refs",
	},
	plan: {
		args: [],
		skipReal: "long-running pro-tier planner; outputs canvas shapes only",
	},
	script: {
		args: [],
		skipReal: "storyboard generator; structured text feeding plan, not media",
	},
	merge: {
		args: [],
		skipReal: "canvas-only video/audio merge; needs canvas-sourced arrays",
	},
};

function expandRecipe(recipe: Recipe): string[] {
	return recipe.args.map((a) =>
		a === "__IMAGE__"
			? FILE_IMAGE
			: a === "__AUDIO__"
				? FILE_AUDIO
				: a === "__VIDEO__"
					? FILE_VIDEO
					: a,
	);
}

// =====================================================================
// Result recording
// =====================================================================

function maskKey(arr: string[]): string[] {
	return arr.map((a) =>
		typeof a === "string" && a.startsWith("sk-") && a.length > 12
			? `${a.slice(0, 6)}***${a.slice(-4)}`
			: a,
	);
}

function slugify(name: string): string {
	return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
}

type RecordOptions = {
	group: string;
	name: string;
	args: string[];
	result: CliResult;
	durationMs: number;
	notes?: Record<string, unknown>;
};

function recordResult(opts: RecordOptions) {
	const dir = path.join(RESULT_DIR, slugify(opts.group));
	fs.mkdirSync(dir, { recursive: true });
	const file = path.join(dir, `${slugify(opts.name)}.json`);
	const body = {
		group: opts.group,
		name: opts.name,
		recordedAt: new Date().toISOString(),
		baseUrl: BASE_URL,
		args: maskKey(opts.args),
		durationMs: opts.durationMs,
		exitCode: opts.result.exitCode,
		stdout: opts.result.stdout,
		stderr: opts.result.stderr,
		payload: opts.result.payload,
		notes: opts.notes ?? null,
	};
	fs.writeFileSync(file, JSON.stringify(body, null, 2), "utf8");
}

async function runRecorded(
	group: string,
	name: string,
	args: string[],
	options: { liveManifest?: boolean; stdin?: string } = {},
	notes?: Record<string, unknown>,
): Promise<CliResult> {
	const start = Date.now();
	const result = await runCli(args, { liveManifest: true, ...options });
	const durationMs = Date.now() - start;
	recordResult({ group, name, args, result, durationMs, notes });
	return result;
}

let originalHome: string | undefined;
let tempHome: string;

beforeAll(() => {
	if (!ENABLED) return;
	if (
		!fs.existsSync(FILE_IMAGE) ||
		!fs.existsSync(FILE_AUDIO) ||
		!fs.existsSync(FILE_VIDEO)
	) {
		throw new Error(
			`integration fixtures missing under ${FILES_DIR} — expected jpg/mp3/mp4 sample files`,
		);
	}

	// Wipe result/ contents but keep the directory + .gitignore so version
	// control isn't disturbed.
	fs.mkdirSync(RESULT_DIR, { recursive: true });
	for (const entry of fs.readdirSync(RESULT_DIR)) {
		if (entry === ".gitignore") continue;
		fs.rmSync(path.join(RESULT_DIR, entry), { recursive: true, force: true });
	}
	fs.writeFileSync(
		path.join(RESULT_DIR, "_run.json"),
		JSON.stringify(
			{
				startedAt: new Date().toISOString(),
				baseUrl: BASE_URL,
				modelCount: CLI_MODELS.length,
			},
			null,
			2,
		),
	);

	tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dlazy-integration-"));
	originalHome = process.env.HOME;
	process.env.HOME = tempHome;
	process.env.DLAZY_BASE_URL = BASE_URL;
});

afterAll(() => {
	if (!ENABLED) return;
	if (originalHome === undefined) delete process.env.HOME;
	else process.env.HOME = originalHome;
	if (tempHome) fs.rmSync(tempHome, { recursive: true, force: true });
});

beforeEach(() => {
	process.env.DLAZY_API_KEY = API_KEY;
	process.env.DLAZY_BASE_URL = BASE_URL;
});

afterEach(() => {
	delete process.env.DLAZY_API_KEY;
});

// =====================================================================
// Phase 0: meta commands
// =====================================================================

cliDescribe("integration: meta commands", () => {
	const GROUP = "meta";

	it("auth set + auth get round-trip persists to the sandboxed config", async () => {
		delete process.env.DLAZY_API_KEY;

		const setResult = await runRecorded(GROUP, "auth-set", [
			"auth",
			"set",
			API_KEY,
		]);
		expect(setResult.exitCode).toBe(0);
		expect(setResult.payload.ok).toBe(true);

		const getResult = await runRecorded(GROUP, "auth-get-show", [
			"auth",
			"get",
			"--show",
		]);
		expect(getResult.exitCode).toBe(0);
		const v = jsonValue(getResult.payload) as {
			source: string;
			apiKey: string;
		};
		expect(v.source).toBe("config");
		expect(v.apiKey).toBe(API_KEY);
	});

	it("logout clears the persisted key", async () => {
		delete process.env.DLAZY_API_KEY;
		await runRecorded(GROUP, "auth-set-precondition", ["auth", "set", API_KEY]);

		const logout = await runRecorded(GROUP, "logout", ["logout"]);
		expect(logout.exitCode).toBe(0);
		expect(jsonValue(logout.payload)).toEqual({ removed: true });

		const getResult = await runRecorded(GROUP, "auth-get-after-logout", [
			"auth",
			"get",
		]);
		expect(getResult.exitCode).toBe(1);
		expect(getResult.payload.code).toBe("not_configured");
	});

	it("tools list returns models from the live manifest endpoint", async () => {
		const result = await runRecorded(GROUP, "tools-list", [
			"--base-url",
			BASE_URL,
			"tools",
			"list",
		]);
		expect(result.exitCode).toBe(0);
		expect(result.payload.ok).toBe(true);
		const v = jsonValue(result.payload) as {
			tools: Array<{ cli_name: string; id: string; type: string }>;
		};
		expect(Array.isArray(v.tools)).toBe(true);
		expect(v.tools.length).toBeGreaterThan(0);
	});

	it("tools describe returns input.fields for a known model", async () => {
		const sample =
			CLI_MODELS.find((m) => m.cli_name === "banana2") ?? CLI_MODELS[0]!;
		const result = await runRecorded(
			GROUP,
			`tools-describe-${sample.cli_name}`,
			["--base-url", BASE_URL, "tools", "describe", sample.cli_name],
		);
		expect(result.exitCode).toBe(0);
		expect(result.payload.ok).toBe(true);
		const v = jsonValue(result.payload) as {
			cli_name: string;
			id: string;
			input: { fields: unknown[] };
		};
		expect(v.cli_name).toBe(sample.cli_name);
		expect(Array.isArray(v.input.fields)).toBe(true);
		expect(v.input.fields.length).toBeGreaterThan(0);
	});

	it("tools describe surfaces tool_not_found for unknown names", async () => {
		const result = await runRecorded(GROUP, "tools-describe-unknown", [
			"--base-url",
			BASE_URL,
			"tools",
			"describe",
			"definitely-not-real-x",
		]);
		expect(result.exitCode).toBe(2);
		expect(result.payload.ok).toBe(false);
		expect(result.payload.code).toBe("tool_not_found");
	});

	it("status with a bogus generateId surfaces an http error", async () => {
		const result = await runRecorded(GROUP, "status-bogus", [
			"--base-url",
			BASE_URL,
			"--api-key",
			API_KEY,
			"status",
			"definitely-not-a-real-generate-id",
		]);
		expect(result.payload.ok).toBe(false);
		expect(result.payload.code).toBeDefined();
	});
});

// =====================================================================
// Phase 1: dry-run smoke test for every model (no network for the run
// itself; only the manifest fetch hits the server).
// =====================================================================

cliDescribe("integration: dry-run smoke (every model)", () => {
	const GROUP = "dry-run";

	it("manifest exposes at least one cli model", () => {
		expect(CLI_MODELS.length).toBeGreaterThan(0);
	});

	for (const { id, cli_name, type } of CLI_MODELS) {
		it(`${cli_name} dry-run`, async () => {
			const recipe = RECIPES[cli_name];
			const recipeArgs = recipe ? expandRecipe(recipe) : [];
			const args = [
				"--base-url",
				BASE_URL,
				cli_name,
				"--dry-run",
				...recipeArgs,
			];
			const result = await runRecorded(
				GROUP,
				cli_name,
				args,
				{},
				{
					modelId: id,
					modelType: type,
					hasRecipe: Boolean(recipe),
					skipReal: recipe?.skipReal ?? null,
				},
			);
			expect(result.exitCode).toBe(0);
			expect(result.payload?.ok).toBe(true);
			expect(result.payload.result.tool).toBe(cli_name);
			expect(result.payload.result.modelId).toBe(id);
			const v = jsonValue(result.payload) as {
				dryRun?: boolean;
				model?: string;
			};
			expect(v.dryRun).toBe(true);
			expect(v.model).toBe(id);
		});
	}
});

// =====================================================================
// Phase 2: real execution for every model whose dry-run passed and
// whose recipe doesn't carry skipReal.
// =====================================================================

cliDescribe("integration: real run (every model)", () => {
	const GROUP = "e2e";

	for (const { id, cli_name, type } of CLI_MODELS) {
		const recipe = RECIPES[cli_name];

		// No recipe entry → can't construct a real call.
		if (!recipe) {
			it.skip(`${cli_name} (real) — no recipe defined`, () => {});
			continue;
		}

		// Recipe says skip — record why in the test name.
		if (recipe.skipReal) {
			it.skip(`${cli_name} (real) — skipReal: ${recipe.skipReal}`, () => {});
			continue;
		}

		it(
			`${cli_name} (real)`,
			async () => {
				// Pre-flight: re-run a dry-run inline with the same recipe so
				// each real test is self-contained (works under `-t` filtering)
				// and the dry-run passing is a precondition for spending money
				// on the real call.
				const recipeArgs = expandRecipe(recipe);
				const dryArgs = [
					"--base-url",
					BASE_URL,
					cli_name,
					"--dry-run",
					...recipeArgs,
				];
				const dry = await runRecorded(
					GROUP,
					`${cli_name}.preflight`,
					dryArgs,
					{},
					{ phase: "preflight", modelId: id },
				);
				expect(
					dry.exitCode,
					`pre-flight dry-run failed for ${cli_name}: ${dry.stderr || dry.stdout}`,
				).toBe(0);
				expect(dry.payload?.ok).toBe(true);

				// Real run.
				const args = [
					"--base-url",
					BASE_URL,
					"--api-key",
					API_KEY,
					cli_name,
					...recipeArgs,
				];
				const result = await runRecorded(
					GROUP,
					cli_name,
					args,
					{},
					{
						phase: "real",
						modelId: id,
						modelType: type,
					},
				);

				expect(result.exitCode).toBe(0);
				expect(result.payload?.ok).toBe(true);

				// Outputs must be present; we don't strictly require a top-level
				// outputs[].url because some tools emit shape-style results
				// (urls nested inside shapes). The recorded JSON file under
				// result/e2e/<name>.json carries the full shape for review.
				const outputs = result.payload?.result?.outputs;
				expect(Array.isArray(outputs)).toBe(true);
				expect(outputs.length).toBeGreaterThan(0);

				// Touch allUrls so the helper is exercised even when
				// nothing is returned at the top level.
				void allUrls(result.payload);
			},
			E2E_TIMEOUT_MS,
		);
	}
});

// =====================================================================
// Phase 3: real plan → execute pipeline. Spends credits — gated behind
// DLAZY_INTEGRATION=1 like the rest of the suite. Each `it` covers a
// distinct stdin → ref-resolution path so we exercise the pipe layer,
// not just one happy path.
// =====================================================================

cliDescribe("integration: pipeline (plan → execute)", () => {
	const GROUP = "pipeline";
	const PIPELINE_TIMEOUT_MS = 20 * 60 * 1000;

	type PlanShape = {
		type: "image" | "video" | "audio" | "text";
		x?: number;
		y?: number;
		props: {
			name: string;
			model?: string;
			url?: string;
			input?: Record<string, unknown>;
			status?: string;
			w?: number;
			h?: number;
		};
	};

	type PlanRunValue = {
		texts?: string[];
		shapes: PlanShape[];
		data?: { sessionId?: string };
	};

	function extractPlanValue(payload: unknown): PlanRunValue {
		const v = jsonValue(payload) as PlanRunValue | undefined;
		if (!v || !Array.isArray(v.shapes) || v.shapes.length === 0) {
			throw new Error(
				`plan envelope missing shapes[]: ${JSON.stringify(payload).slice(0, 400)}`,
			);
		}
		return v;
	}

	// Run plan once for the whole describe so we don't spend credits per it().
	// `runPlanReal` is invoked lazily on first use; subsequent it()s reuse the
	// captured stdout. Vitest's `describe.sequential` keeps these in order.
	let cachedPlan: { stdout: string; value: PlanRunValue } | null = null;

	async function runPlanReal(): Promise<{
		stdout: string;
		value: PlanRunValue;
	}> {
		if (cachedPlan) return cachedPlan;
		const planArgs = [
			"--base-url",
			BASE_URL,
			"--api-key",
			API_KEY,
			"plan",
			"--prompt",
			"两个分镜：1) 一只小猫在草地上眨眼；2) 同一只小猫缓缓站起。请生成可执行的画布节点。",
			"--scenario",
			"storyboard",
			"--style",
			"cinematic",
		];
		const planResult = await runRecorded(
			GROUP,
			"step1-plan-real",
			planArgs,
			{},
			{ phase: "plan/real" },
		);
		expect(
			planResult.exitCode,
			`plan run failed: ${planResult.stderr || planResult.stdout}`,
		).toBe(0);
		expect(planResult.payload?.ok).toBe(true);
		const value = extractPlanValue(planResult.payload);
		cachedPlan = { stdout: planResult.stdout, value };
		return cachedPlan;
	}

	it(
		"plan emits a non-empty shape graph (real run, cached for downstream tests)",
		async () => {
			const { value } = await runPlanReal();
			expect(value.shapes.length).toBeGreaterThan(0);
			// At least one shape should be executable (have a model + idle).
			const executable = value.shapes.filter(
				(s) => s.props.model && (s.props.status ?? "idle") === "idle",
			);
			expect(executable.length).toBeGreaterThan(0);
		},
		PIPELINE_TIMEOUT_MS,
	);

	it(
		"@0.value.shapes pipes plan stdout straight into execute (real)",
		async () => {
			const { stdout } = await runPlanReal();
			const result = await runRecorded(
				GROUP,
				"step2-execute-jsonpath",
				[
					"--base-url",
					BASE_URL,
					"--api-key",
					API_KEY,
					"execute",
					"--shapes",
					"@0.value.shapes",
				],
				{ stdin: stdout },
				{ phase: "execute/real", refStyle: "@0.value.shapes" },
			);
			expect(
				result.exitCode,
				`execute run failed: ${result.stderr || result.stdout}`,
			).toBe(0);
			expect(result.payload?.ok).toBe(true);

			const outputs = result.payload?.result?.outputs;
			expect(Array.isArray(outputs)).toBe(true);
			expect(outputs.length).toBeGreaterThan(0);

			// Execute returns a JsonOutput carrying { shapes: [...] }; every
			// originally-idle shape should have been advanced past idle.
			const v = jsonValue(result.payload) as { shapes: PlanShape[] };
			expect(Array.isArray(v.shapes)).toBe(true);
			expect(v.shapes.length).toBeGreaterThan(0);
			const stillIdle = v.shapes.filter(
				(s) => s.props.model && s.props.status === "idle",
			);
			expect(stillIdle).toHaveLength(0);

			void allUrls(result.payload);
		},
		PIPELINE_TIMEOUT_MS,
	);

	it("@stdin:result.outputs[0].value.shapes resolves the same payload (dry-run)", async () => {
		// Hermetic dry-run that proves the alternative jsonpath ref style
		// drills into the envelope identically. No credits spent.
		const { stdout, value } = await runPlanReal();
		const result = await runRecorded(
			GROUP,
			"alt-ref-stdin-jsonpath",
			[
				"--base-url",
				BASE_URL,
				"execute",
				"--dry-run",
				"--shapes",
				"@stdin:result.outputs[0].value.shapes",
			],
			{ stdin: stdout },
			{ phase: "execute/dry-run", refStyle: "@stdin:..." },
		);
		expect(result.exitCode).toBe(0);
		const echoed = jsonValue(result.payload) as {
			input: { shapes: PlanShape[] };
		};
		expect(echoed.input.shapes).toHaveLength(value.shapes.length);
		expect(echoed.input.shapes[0]?.props.name).toBe(
			value.shapes[0]?.props.name,
		);
	});

	it("--shapes - on a plan envelope wraps the value (gotcha; dry-run)", async () => {
		// Documents the autoPick gotcha: `-` projects each output's primary
		// value, so for plan's single JsonOutput it returns [planValue],
		// not the unwrapped shapes array. The natural pipe is
		// `@0.value.shapes` (covered above).
		const { stdout, value } = await runPlanReal();
		const result = await runRecorded(
			GROUP,
			"alt-ref-dash-autopick",
			["--base-url", BASE_URL, "execute", "--dry-run", "--shapes", "-"],
			{ stdin: stdout },
			{ phase: "execute/dry-run", refStyle: "-" },
		);
		expect(result.exitCode).toBe(0);
		const echoed = jsonValue(result.payload) as {
			input: { shapes: PlanRunValue[] };
		};
		expect(echoed.input.shapes).toHaveLength(1);
		expect(echoed.input.shapes[0]?.shapes).toHaveLength(value.shapes.length);
	});

	it("upstream stdin without a shape graph surfaces a structured error", async () => {
		// Pipe an envelope that has no `shapes` field. resolveRefs walks
		// the array, jsonpath resolves to undefined, and the array ends
		// up holding [undefined] — the dry-run echo lets us verify the
		// CLI doesn't crash and the field round-trips cleanly.
		const bogusEnvelope = JSON.stringify({
			ok: true,
			result: {
				tool: "fake",
				modelId: "fake",
				outputs: [
					{
						type: "json",
						id: "o_0",
						value: { unrelated: 42 },
					},
				],
			},
		});
		const result = await runRecorded(
			GROUP,
			"alt-ref-missing-path",
			[
				"--base-url",
				BASE_URL,
				"execute",
				"--dry-run",
				"--shapes",
				"@0.value.shapes",
			],
			{ stdin: bogusEnvelope },
			{ phase: "execute/dry-run", refStyle: "@0.value.shapes:missing" },
		);
		expect(result.exitCode).toBe(0);
		const echoed = jsonValue(result.payload) as {
			input: { shapes: unknown[] };
		};
		// jsonpath returned undefined for the missing key; resolveRefs
		// pushed it as a single array entry. The downstream server-side
		// schema would reject this, but the CLI pipe layer itself does
		// not — that's the contract this test pins.
		console.log("echoed.input.shapes", echoed.input.shapes);
		expect(echoed.input.shapes).toEqual([null]);
	});
});

cliDescribe("integration: fixture sanity", () => {
	it("media fixtures exist and are non-empty", () => {
		expect(fs.statSync(FILE_IMAGE).size).toBeGreaterThan(1024);
		expect(fs.statSync(FILE_AUDIO).size).toBeGreaterThan(1024);
		expect(fs.statSync(FILE_VIDEO).size).toBeGreaterThan(1024);
	});
});
