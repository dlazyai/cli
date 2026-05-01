import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAiModels } from "../../../config/modal.config";
import * as config from "../src/utils/config";
import { jsonValue, runCli } from "./_helpers/run-cli";

const SKIPPED = new Set(["qwen3.6-plus"]);

function pickFirstCliModel(): { id: string; cli_name: string } {
	const models = getAiModels();
	for (const [id, cfg] of Object.entries(models)) {
		if (cfg.cli_name && !SKIPPED.has(cfg.cli_name)) {
			return { id, cli_name: cfg.cli_name };
		}
	}
	throw new Error("no cli-enabled model found");
}

describe.sequential("tools list", () => {
	it("returns the registry of cli-exposed models", async () => {
		const result = await runCli(["tools", "list"]);

		expect(result.exitCode).toBe(0);
		expect(result.payload.ok).toBe(true);
		const v = jsonValue(result.payload) as {
			tools: Array<{ cli_name: string; id: string; type: string }>;
		};
		expect(Array.isArray(v.tools)).toBe(true);
		expect(v.tools.length).toBeGreaterThan(0);
		for (const tool of v.tools) {
			expect(typeof tool.cli_name).toBe("string");
			expect(typeof tool.id).toBe("string");
			expect(typeof tool.type).toBe("string");
		}
		const names = v.tools.map((t) => t.cli_name);
		expect(names).not.toContain("qwen3.6-plus");
	});
});

describe.sequential("tools describe", () => {
	it("describes a registered tool by cli_name", async () => {
		const sample = pickFirstCliModel();
		const result = await runCli(["tools", "describe", sample.cli_name]);

		expect(result.exitCode).toBe(0);
		expect(result.payload.ok).toBe(true);
		const v = jsonValue(result.payload) as {
			cli_name: string;
			id: string;
			input: { fields: unknown[]; jsonSchema: unknown };
		};
		expect(v.cli_name).toBe(sample.cli_name);
		expect(v.id).toBe(sample.id);
		expect(Array.isArray(v.input.fields)).toBe(true);
		expect(v.input.jsonSchema).toBeDefined();
	});

	it("returns tool_not_found with available list when name is unknown", async () => {
		const result = await runCli(["tools", "describe", "definitely-not-real"]);

		expect(result.exitCode).toBe(2);
		expect(result.payload.ok).toBe(false);
		expect(result.payload.code).toBe("tool_not_found");
		expect(Array.isArray(result.payload.details.availableTools)).toBe(true);
		expect(result.payload.details.availableTools.length).toBeGreaterThan(0);
	});
});

describe.sequential("status", () => {
	const ORIGINAL_FETCH = globalThis.fetch;
	const ORIGINAL_ENV_KEY = process.env.DLAZY_API_KEY;

	beforeEach(() => {
		process.env.DLAZY_API_KEY = "test-key";
		vi.spyOn(config, "isHeadless").mockReturnValue(true);
	});

	afterEach(() => {
		globalThis.fetch = ORIGINAL_FETCH;
		if (ORIGINAL_ENV_KEY === undefined) delete process.env.DLAZY_API_KEY;
		else process.env.DLAZY_API_KEY = ORIGINAL_ENV_KEY;
		vi.restoreAllMocks();
	});

	it("fetches status via GET and forwards generateId in the query", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			text: async () => "",
			json: async () => ({ status: "running" }),
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const result = await runCli([
			"--base-url",
			"https://api.example.com",
			"status",
			"gen-abc",
		]);

		expect(result.exitCode).toBe(0);
		expect(result.payload.ok).toBe(true);
		expect(jsonValue(result.payload)).toEqual({ status: "running" });
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0]!;
		expect(url).toBe("https://api.example.com/api/cli/tool?generateId=gen-abc");
		expect((init as RequestInit).headers).toMatchObject({
			Authorization: "Bearer test-key",
		});
	});

	it("emits http_error on non-OK response", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			text: async () => "boom",
			json: async () => ({}),
		}) as unknown as typeof fetch;

		const result = await runCli([
			"--base-url",
			"https://api.example.com",
			"status",
			"gen-abc",
		]);

		expect(result.exitCode).toBe(1);
		expect(result.payload.ok).toBe(false);
		expect(result.payload.code).toBe("http_error");
	});

	it("emits cli_version_too_low on HTTP 426 with upgrade hint", async () => {
		const body = JSON.stringify({
			error: "cli_version_too_low",
			message: "old",
			details: {
				currentVersion: "0.9.0",
				minVersion: "1.0.0",
				latestVersion: "1.2.3",
				upgradeCommand: "npm install -g @dlazy/cli@latest",
			},
		});
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 426,
			text: async () => body,
			json: async () => JSON.parse(body),
		}) as unknown as typeof fetch;

		const result = await runCli([
			"--base-url",
			"https://api.example.com",
			"status",
			"gen-abc",
		]);

		expect(result.exitCode).toBe(1);
		expect(result.payload.ok).toBe(false);
		expect(result.payload.code).toBe("cli_version_too_low");
		expect(result.payload.message).toContain(
			"npm install -g @dlazy/cli@latest",
		);
	});

	it("fails with no_api_key when no key is available in headless mode", async () => {
		delete process.env.DLAZY_API_KEY;
		vi.spyOn(config, "loadConfig").mockReturnValue({});

		const result = await runCli(["status", "gen-abc"]);

		expect(result.exitCode).toBe(1);
		expect(result.payload.ok).toBe(false);
		expect(result.payload.code).toBe("no_api_key");
	});
});
