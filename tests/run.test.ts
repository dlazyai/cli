import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type AIModelConfig, getAiModels } from "../../../config/modal.config";
import { jsonValue, runCli } from "./_helpers/run-cli";

const SKIPPED = new Set(["qwen3.6-plus"]);

function listCliModels(): Array<{
	id: string;
	cli_name: string;
	cfg: AIModelConfig;
}> {
	const out: Array<{ id: string; cli_name: string; cfg: AIModelConfig }> = [];
	for (const [id, cfg] of Object.entries(getAiModels())) {
		if (!cfg.cli_name) continue;
		if (SKIPPED.has(cfg.cli_name)) continue;
		out.push({ id, cli_name: cfg.cli_name, cfg });
	}
	return out;
}

const CLI_MODELS = listCliModels();

afterEach(() => {
	vi.restoreAllMocks();
});

describe.sequential("run --dry-run", () => {
	it("registers a command for every cli-exposed model", async () => {
		expect(CLI_MODELS.length).toBeGreaterThan(0);
	});

	for (const { id, cli_name } of CLI_MODELS) {
		it(`${cli_name} returns a dryRun envelope echoing the model id`, async () => {
			const result = await runCli([cli_name, "--dry-run"]);

			expect(result.exitCode).toBe(0);
			expect(result.payload?.ok).toBe(true);
			expect(result.payload.result.tool).toBe(cli_name);
			expect(result.payload.result.modelId).toBe(id);
			const v = jsonValue(result.payload) as Record<string, unknown>;
			expect(v.dryRun).toBe(true);
			expect(v.model).toBe(id);
			expect(v.input).toBeDefined();
			expect(typeof v.input).toBe("object");
			expect("estimatedCostCredits" in v).toBe(true);
			expect("estimatedDurationSeconds" in v).toBe(true);
		});
	}

	it("merges --input JSON and flag values into the dry-run payload (flags win)", async () => {
		const sample = CLI_MODELS[0]!;
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-run-"));
		const inputFile = path.join(tmpDir, "input.json");
		fs.writeFileSync(
			inputFile,
			JSON.stringify({ extra: "from-file", _shared: "file" }),
		);

		try {
			const result = await runCli([
				sample.cli_name,
				"--dry-run",
				"--input",
				`@${inputFile}`,
			]);

			expect(result.exitCode).toBe(0);
			const v = jsonValue(result.payload) as Record<string, any>;
			expect(v.dryRun).toBe(true);
			expect(v.input.extra).toBe("from-file");
			expect(v.input._shared).toBe("file");
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("dry-run does not touch the network", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch");
		const sample = CLI_MODELS[0]!;

		const result = await runCli([sample.cli_name, "--dry-run"]);

		expect(result.exitCode).toBe(0);
		expect((jsonValue(result.payload) as { dryRun?: boolean }).dryRun).toBe(
			true,
		);
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
