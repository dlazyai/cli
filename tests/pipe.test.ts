import { afterEach, describe, expect, it, vi } from "vitest";
import { type AIModelConfig, getAiModels } from "../../../config/modal.config";
import { allUrls, jsonValue, runCli } from "./_helpers/run-cli";

afterEach(() => {
	vi.restoreAllMocks();
});

function pickModelByCli(name: string): { id: string; cfg: AIModelConfig } {
	for (const [id, cfg] of Object.entries(getAiModels())) {
		if (cfg.cli_name === name) return { id, cfg };
	}
	throw new Error(`no model with cli_name=${name}`);
}

/** Build an upstream envelope as if a previous `dlazy <tool>` had emitted it. */
function envelope(tool: string, modelId: string, urls: string[]) {
	return JSON.stringify({
		ok: true,
		result: {
			tool,
			modelId,
			outputs: urls.map((url, i) => ({
				type: "image" as const,
				id: `o_${i}`,
				url,
				mimeType: "image/png",
			})),
		},
	});
}

describe.sequential("pipe references", () => {
	// Pick any model with an `image` field for `--image -` tests.
	const consumer = pickModelByCli("seedream-4.5");

	it("--prompt - reads upstream text and substitutes it", async () => {
		const upstream = JSON.stringify({
			ok: true,
			result: {
				tool: "script-gen",
				modelId: "script-gen",
				outputs: [
					{ type: "text" as const, id: "o_0", text: "a cyberpunk cat" },
				],
			},
		});

		const result = await runCli(
			[consumer.cfg.cli_name!, "--dry-run", "--prompt", "-"],
			{ stdin: upstream },
		);

		expect(result.exitCode).toBe(0);
		const v = jsonValue(result.payload) as { input: { prompt: string } };
		expect(v.input.prompt).toBe("a cyberpunk cat");
	});

	it("@0.url drills into the first output's url field", async () => {
		const upstream = envelope("seedream-4.5", consumer.id, [
			"https://cdn.example.com/img-a.png",
			"https://cdn.example.com/img-b.png",
		]);

		const result = await runCli(
			[consumer.cfg.cli_name!, "--dry-run", "--prompt", "@0.url"],
			{ stdin: upstream },
		);

		expect(result.exitCode).toBe(0);
		const v = jsonValue(result.payload) as { input: { prompt: string } };
		expect(v.input.prompt).toBe("https://cdn.example.com/img-a.png");
	});

	it("@stdin:result.modelId reads any path inside the upstream envelope", async () => {
		const upstream = envelope("seedream-4.5", consumer.id, [
			"https://cdn.example.com/x.png",
		]);

		const result = await runCli(
			[
				consumer.cfg.cli_name!,
				"--dry-run",
				"--prompt",
				"@stdin:result.modelId",
			],
			{ stdin: upstream },
		);

		expect(result.exitCode).toBe(0);
		const v = jsonValue(result.payload) as { input: { prompt: string } };
		expect(v.input.prompt).toBe(consumer.id);
	});

	it("--output url prints just the URL on stdout for media results", async () => {
		// Simulate a successful run by using a dry-run echo that's then printed
		// via --output url. Dry-run produces a json output, so test url output
		// against a synthesized urls envelope by going through the pipe layer.
		// The simplest reliable path: assert via a manual ToolResult — emit
		// directly through the success() helper.
		const { success, setOutputMode } = await import("../src/lib/envelope");

		const stdoutChunks: string[] = [];
		const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(((
			chunk: string | Uint8Array,
		) => {
			stdoutChunks.push(
				typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"),
			);
			return true;
		}) as typeof process.stdout.write);
		const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
			_code?: number,
		) => {
			throw new Error("__exit__");
		}) as typeof process.exit);

		setOutputMode("url");
		try {
			success({
				tool: "seedream-4.5",
				modelId: consumer.id,
				outputs: [
					{
						type: "image",
						id: "o_0",
						url: "https://cdn.example.com/u-1.png",
					},
					{
						type: "image",
						id: "o_1",
						url: "https://cdn.example.com/u-2.png",
					},
				],
			});
		} catch {
			/* expected exit */
		}
		writeSpy.mockRestore();
		exitSpy.mockRestore();
		setOutputMode("json");

		expect(stdoutChunks.join("")).toBe(
			"https://cdn.example.com/u-1.png\nhttps://cdn.example.com/u-2.png\n",
		);
	});

	it("dry-run records the substituted value (proves the chain works end-to-end)", async () => {
		const upstream = envelope("seedream-4.5", consumer.id, [
			"https://cdn.example.com/up-A.png",
			"https://cdn.example.com/up-B.png",
		]);

		const result = await runCli(
			[consumer.cfg.cli_name!, "--dry-run", "--prompt", "@1.url"],
			{ stdin: upstream },
		);

		expect(result.exitCode).toBe(0);
		const v = jsonValue(result.payload) as { input: { prompt: string } };
		expect(v.input.prompt).toBe("https://cdn.example.com/up-B.png");
		// Sanity: the helper's allUrls finds nothing in a dry-run (the output is json).
		expect(allUrls(result.payload)).toEqual([]);
	});
});
