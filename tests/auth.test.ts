import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as config from "../src/utils/config";
import { jsonValue, runCli } from "./_helpers/run-cli";

describe.sequential("auth set", () => {
	let saved: Record<string, any> | null = null;

	beforeEach(() => {
		saved = null;
		vi.spyOn(config, "loadConfig").mockReturnValue({});
		vi.spyOn(config, "saveConfig").mockImplementation((c) => {
			saved = c;
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("trims and persists the api key", async () => {
		const result = await runCli(["auth", "set", "  dl-secret-123  "]);

		expect(result.exitCode).toBe(0);
		expect(result.payload.ok).toBe(true);
		expect(jsonValue(result.payload)).toEqual({
			source: "config",
			saved: true,
		});
		expect(saved).toEqual({ DLAZY_API_KEY: "dl-secret-123" });
	});

	it("preserves other config values when saving", async () => {
		vi.mocked(config.loadConfig).mockReturnValue({ OTHER: "keep" });

		await runCli(["auth", "set", "dl-x"]);

		expect(saved).toEqual({ OTHER: "keep", DLAZY_API_KEY: "dl-x" });
	});
});

describe.sequential("auth get", () => {
	const ORIGINAL_ENV_KEY = process.env.DLAZY_API_KEY;

	afterEach(() => {
		vi.restoreAllMocks();
		if (ORIGINAL_ENV_KEY === undefined) delete process.env.DLAZY_API_KEY;
		else process.env.DLAZY_API_KEY = ORIGINAL_ENV_KEY;
	});

	it("returns env-sourced key when DLAZY_API_KEY is set", async () => {
		process.env.DLAZY_API_KEY = "sk-environment-key-9999";
		vi.spyOn(config, "loadConfig").mockReturnValue({
			DLAZY_API_KEY: "config-key",
		});

		const result = await runCli(["auth", "get", "--show"]);

		expect(result.exitCode).toBe(0);
		expect(result.payload.ok).toBe(true);
		expect(jsonValue(result.payload)).toEqual({
			source: "env",
			apiKey: "sk-environment-key-9999",
		});
	});

	it("masks the key by default (no --show)", async () => {
		process.env.DLAZY_API_KEY = "sk-environment-key-9999";
		const result = await runCli(["auth", "get"]);

		expect(result.exitCode).toBe(0);
		const v = jsonValue(result.payload) as { apiKey: string };
		expect(v.apiKey).not.toContain("environment");
		expect(v.apiKey.endsWith("9999")).toBe(true);
	});

	it("falls back to config when env is unset", async () => {
		delete process.env.DLAZY_API_KEY;
		vi.spyOn(config, "loadConfig").mockReturnValue({
			DLAZY_API_KEY: "sk-config-key-1234",
		});

		const result = await runCli(["auth", "get", "--show"]);

		expect(result.exitCode).toBe(0);
		expect(result.payload.ok).toBe(true);
		expect(jsonValue(result.payload)).toEqual({
			source: "config",
			apiKey: "sk-config-key-1234",
		});
	});

	it("fails with not_configured when neither source has a key", async () => {
		delete process.env.DLAZY_API_KEY;
		vi.spyOn(config, "loadConfig").mockReturnValue({});

		const result = await runCli(["auth", "get"]);

		expect(result.exitCode).toBe(1);
		expect(result.payload.ok).toBe(false);
		expect(result.payload.code).toBe("not_configured");
	});
});

describe.sequential("login", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("saves the fetched key on successful login", async () => {
		vi.spyOn(config, "waitForApiKeyAuth").mockResolvedValue("fetched-key");
		vi.spyOn(config, "loadConfig").mockReturnValue({});
		const saveSpy = vi
			.spyOn(config, "saveConfig")
			.mockImplementation(() => undefined);

		const result = await runCli(["login"]);

		expect(result.exitCode).toBe(0);
		expect(result.payload.ok).toBe(true);
		expect(jsonValue(result.payload)).toEqual({ saved: true });
		expect(saveSpy).toHaveBeenCalledWith({ DLAZY_API_KEY: "fetched-key" });
	});

	it("forwards failures from waitForApiKeyAuth as login_failed", async () => {
		vi.spyOn(config, "waitForApiKeyAuth").mockRejectedValue(
			new Error("authorization expired"),
		);

		const result = await runCli(["login"]);

		expect(result.exitCode).toBe(1);
		expect(result.payload.ok).toBe(false);
		expect(result.payload.code).toBe("login_failed");
		expect(result.payload.message).toBe("authorization expired");
	});

	it("passes --local through to waitForApiKeyAuth", async () => {
		const waitSpy = vi
			.spyOn(config, "waitForApiKeyAuth")
			.mockResolvedValue("local-key");
		vi.spyOn(config, "loadConfig").mockReturnValue({});
		vi.spyOn(config, "saveConfig").mockImplementation(() => undefined);

		await runCli(["login", "--local"]);

		expect(waitSpy).toHaveBeenCalledWith({ local: true });
	});
});

describe.sequential("logout", () => {
	const ORIGINAL_ENV_KEY = process.env.DLAZY_API_KEY;
	let saved: Record<string, any> | null = null;

	beforeEach(() => {
		saved = null;
		vi.spyOn(config, "saveConfig").mockImplementation((c) => {
			saved = c;
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		if (ORIGINAL_ENV_KEY === undefined) delete process.env.DLAZY_API_KEY;
		else process.env.DLAZY_API_KEY = ORIGINAL_ENV_KEY;
	});

	it("removes the api key from config when present", async () => {
		delete process.env.DLAZY_API_KEY;
		vi.spyOn(config, "loadConfig").mockReturnValue({
			DLAZY_API_KEY: "dl-x",
			OTHER: "keep",
		});

		const result = await runCli(["logout"]);

		expect(result.exitCode).toBe(0);
		expect(result.payload.ok).toBe(true);
		expect(jsonValue(result.payload)).toEqual({ removed: true });
		expect(saved).toEqual({ OTHER: "keep" });
	});

	it("is idempotent when no api key is configured", async () => {
		delete process.env.DLAZY_API_KEY;
		vi.spyOn(config, "loadConfig").mockReturnValue({});

		const result = await runCli(["logout"]);

		expect(result.exitCode).toBe(0);
		expect(result.payload.ok).toBe(true);
		expect(jsonValue(result.payload)).toEqual({ removed: false });
		expect(saved).toBeNull();
	});
});
