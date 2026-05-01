import { afterEach, describe, expect, it, vi } from "vitest";
import * as config from "../src/utils/config";
import * as utils from "../src/utils/utils";
import { runCli } from "./_helpers/run-cli";
import {
	type ApiMockOutput,
	type AuthSample,
	type BuiltinSample,
	type DocSample,
	docSamples,
	type StatusErrorSample,
	type ToolCallSample,
} from "./samples";

afterEach(() => {
	vi.restoreAllMocks();
});

/**
 * Minimal POSIX-style tokenizer — handles `"..."`, `'...'`, and `\<c>`
 * escapes; treats `|` / `>` / `2>` as their own separators so trailing
 * shell glue lands in distinct tokens. Sufficient for the static command
 * strings we ship in docs.
 */
function shellTokenize(line: string): string[] {
	const out: string[] = [];
	let cur = "";
	let inS = false;
	let inD = false;
	const flush = () => {
		if (cur) {
			out.push(cur);
			cur = "";
		}
	};
	for (let i = 0; i < line.length; i++) {
		const c = line[i]!;
		if (c === "'" && !inD) {
			inS = !inS;
			continue;
		}
		if (c === '"' && !inS) {
			inD = !inD;
			continue;
		}
		if (c === "\\" && !inS && i + 1 < line.length) {
			cur += line[i + 1];
			i++;
			continue;
		}
		// `#` outside quotes starts a shell comment — drop the rest.
		if (!inS && !inD && c === "#") {
			flush();
			break;
		}
		if (!inS && !inD && (c === " " || c === "\t")) {
			flush();
			continue;
		}
		if (!inS && !inD && c === "|") {
			flush();
			out.push("|");
			continue;
		}
		if (!inS && !inD && c === ">") {
			flush();
			out.push(">");
			continue;
		}
		cur += c;
	}
	flush();
	return out;
}

function expectedPrefix(sample: DocSample): string[] {
	if (sample.invocation === "npx") return ["npx", "@dlazy/cli@latest"];
	return ["dlazy"];
}

function rawFromMock(mock: ApiMockOutput): unknown {
	if (mock.kind === "media-urls") return { urls: mock.urls };
	if (mock.kind === "text") return { text: mock.text };
	return mock.value;
}

/**
 * Stub `/api/cli/tool/estimate` and the `/api/cli/tool` POST. The runCli
 * helper layers its manifest stub on top of whatever `globalThis.fetch`
 * we install here, so manifest fetches still resolve locally.
 *
 * We use the *synchronous* response path (POST returns the final raw
 * output, no `generateId`). The CLI doesn't poll, so tests don't pay the
 * 3 s default poll interval per sample.
 */
function mockToolApi(rawOutput: unknown) {
	const fetchFn = vi.fn(async (input: unknown, init?: { method?: string }) => {
		const url =
			typeof input === "string"
				? input
				: input instanceof URL
					? input.toString()
					: String(input);
		const method = (init?.method ?? "GET").toUpperCase();
		const json = (body: unknown) =>
			new Response(JSON.stringify(body), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		if (url.includes("/api/cli/tool/estimate") && method === "POST") {
			return json({
				estimatedCostCredits: null,
				estimatedDurationSeconds: null,
			});
		}
		if (url.includes("/api/cli/tool") && method === "POST") {
			return json({ output: rawOutput });
		}
		throw new Error(`samples.test: unexpected fetch ${method} ${url}`);
	});
	globalThis.fetch = fetchFn as unknown as typeof fetch;
	return fetchFn;
}

/** Stub the `/api/cli/tool?generateId=...` GET to a non-2xx response. */
function mockStatusApi(httpStatus: number) {
	const fetchFn = vi.fn(async (input: unknown) => {
		const url = typeof input === "string" ? input : String(input);
		if (url.includes("/api/cli/tool")) {
			return new Response(JSON.stringify({ error: "not found" }), {
				status: httpStatus,
				headers: { "Content-Type": "application/json" },
			});
		}
		throw new Error(`samples.test: unexpected fetch ${url}`);
	});
	globalThis.fetch = fetchFn as unknown as typeof fetch;
	return fetchFn;
}

function assertCommandShape(sample: DocSample) {
	const tokens = shellTokenize(sample.command);
	const prefix = expectedPrefix(sample);
	expect(tokens.slice(0, prefix.length)).toEqual(prefix);
	const after = tokens.slice(prefix.length);
	if (sample.hasShellGlue) {
		expect(after.slice(0, sample.argv.length)).toEqual(sample.argv);
		// Sanity: the next token should be a shell-glue separator.
		const sep = after[sample.argv.length];
		expect(sep === "|" || sep === ">" || sep === "2>").toBe(true);
	} else {
		expect(after).toEqual(sample.argv);
	}
}

async function runToolCall(sample: ToolCallSample) {
	mockToolApi(rawFromMock(sample.apiOutput));
	const result = await runCli([
		"--base-url",
		"http://localhost:3000",
		"--api-key",
		"sk-test",
		...sample.argv,
	]);
	expect(
		result.exitCode,
		`stderr: ${result.stderr}\nstdout: ${result.stdout}`,
	).toBe(sample.expectedExitCode);
	expect(result.payload?.ok).toBe(true);

	const outputs = result.payload?.result?.outputs as
		| Array<Record<string, unknown>>
		| undefined;
	expect(Array.isArray(outputs)).toBe(true);
	expect(outputs).toHaveLength(sample.expectedOutputs.length);
	sample.expectedOutputs.forEach((expected, i) => {
		const actual = outputs?.[i] ?? {};
		expect(actual.type).toBe(expected.type);
		if (expected.url !== undefined) {
			expect(actual.url).toBe(expected.url);
		}
	});
}

async function runBuiltin(sample: BuiltinSample) {
	// commander throws CommanderError for `--help` / `--version` even with
	// exitOverride; we just want to verify the CLI accepts these flags
	// without crashing differently. The error name is the contract.
	let result: Awaited<ReturnType<typeof runCli>> | null = null;
	try {
		result = await runCli(sample.argv);
	} catch (err) {
		const name = (err as { name?: string }).name;
		if (name !== "CommanderError") throw err;
		// Help / version path — assert the printed text and stop here.
		if (sample.expectedStdoutIncludes !== undefined) {
			const message = (err as { message?: string }).message ?? "";
			expect(message).toContain(sample.expectedStdoutIncludes);
		}
		return;
	}
	expect(
		result.exitCode,
		`stderr: ${result.stderr}\nstdout: ${result.stdout}`,
	).toBe(sample.expectedExitCode);
	if (sample.expectedStdoutIncludes !== undefined) {
		expect(result.stdout + result.stderr).toContain(
			sample.expectedStdoutIncludes,
		);
	}
	if (sample.expectedFirstValueIncludes !== undefined) {
		const value = result.payload?.result?.outputs?.[0]?.value as
			| Record<string, unknown>
			| undefined;
		expect(value).toBeDefined();
		for (const [k, v] of Object.entries(sample.expectedFirstValueIncludes)) {
			expect(value?.[k]).toEqual(v);
		}
	}
	if (sample.expectedFirstValueHasArray !== undefined) {
		const value = result.payload?.result?.outputs?.[0]?.value as
			| Record<string, unknown>
			| undefined;
		const arr = value?.[sample.expectedFirstValueHasArray];
		expect(Array.isArray(arr)).toBe(true);
		expect((arr as unknown[]).length).toBeGreaterThan(0);
	}
}

async function runAuth(sample: AuthSample) {
	const originalEnv = process.env.DLAZY_API_KEY;
	if (sample.preExistingEnv !== undefined) {
		process.env.DLAZY_API_KEY = sample.preExistingEnv;
	} else {
		delete process.env.DLAZY_API_KEY;
	}
	const cfg: Record<string, string> = sample.preExistingConfig ?? {};
	vi.spyOn(config, "loadConfig").mockReturnValue({ ...cfg });
	vi.spyOn(config, "saveConfig").mockImplementation(() => undefined);
	// `dlazy login` triggers a browser device-code flow. The samples
	// covering login assert the failure path (expectedErrorCode:
	// "login_failed") so we stub `waitForApiKeyAuth` to reject — that
	// keeps tests hermetic while still proving the CLI accepts the args.
	vi.spyOn(config, "waitForApiKeyAuth").mockRejectedValue(
		new Error("login disabled in samples test"),
	);

	try {
		const result = await runCli(sample.argv);
		expect(
			result.exitCode,
			`stderr: ${result.stderr}\nstdout: ${result.stdout}`,
		).toBe(sample.expectedExitCode);
		if (sample.expectedErrorCode !== undefined) {
			expect(result.payload?.ok).toBe(false);
			expect(result.payload?.code).toBe(sample.expectedErrorCode);
		} else if (sample.expectedFirstValueIncludes !== undefined) {
			const value = result.payload?.result?.outputs?.[0]?.value as
				| Record<string, unknown>
				| undefined;
			expect(value).toBeDefined();
			for (const [k, v] of Object.entries(sample.expectedFirstValueIncludes)) {
				expect(value?.[k]).toEqual(v);
			}
		}
	} finally {
		if (originalEnv === undefined) delete process.env.DLAZY_API_KEY;
		else process.env.DLAZY_API_KEY = originalEnv;
	}
}

async function runStatusError(sample: StatusErrorSample) {
	mockStatusApi(sample.httpStatus);
	// `--wait` polls with a 3 s default interval; short-circuit `sleep`
	// so the test doesn't pay the wait time for an http_error response.
	vi.spyOn(utils, "sleep").mockResolvedValue();
	// `dlazy status` requires an api-key + base-url to even attempt the
	// fetch; inject them outside argv (which mirrors the docs string).
	const result = await runCli([
		"--base-url",
		"http://localhost:3000",
		"--api-key",
		"sk-test",
		...sample.argv,
	]);
	expect(result.exitCode).toBe(sample.expectedExitCode);
	expect(result.payload?.ok).toBe(false);
	expect(result.payload?.code).toBe(sample.expectedErrorCode);
}

describe.sequential("doc samples", () => {
	for (const sample of docSamples) {
		describe(sample.id, () => {
			it("command tokenizes to argv (with optional shell glue)", () => {
				assertCommandShape(sample);
			});

			it("runs to expected outcome", async () => {
				if (sample.kind === "tool-call") {
					await runToolCall(sample);
				} else if (sample.kind === "builtin") {
					await runBuiltin(sample);
				} else if (sample.kind === "auth") {
					await runAuth(sample);
				} else if (sample.kind === "status-error") {
					await runStatusError(sample);
				}
			});
		});
	}
});
