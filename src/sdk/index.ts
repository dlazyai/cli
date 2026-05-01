/**
 * @dlazy/cli SDK — programmatic access to the same tool runner the CLI uses.
 *
 * Two equivalent call styles:
 *
 *   import { sdk, run, configure } from "@dlazy/cli";
 *   configure({ apiKey: "sk-..." });
 *   const hero = sdk.seedream_4_5({ prompt: "cyberpunk cat" });
 *   const clip = sdk.veo_3_1({ image: hero, prompt: "drone shot" });
 *   const final = await run(clip);
 *
 *   // or with explicit tool name:
 *   import { tool, run } from "@dlazy/cli";
 *   const hero = tool("seedream-4.5", { prompt: "..." });
 *
 * Handles are lazy and thenable, so `await sdk.seedream_4_5({...})` also
 * works for one-shot calls. When a Handle is passed as input to another
 * tool, the runner resolves the upstream and substitutes the natural value
 * (first output's url for media, full primary-value array for array slots).
 */

import { Handle } from "./handle";
import { run, runHandle } from "./runner";

export { SdkError } from "../lib/envelope";
export type {
	JsonOutput,
	MediaOutput,
	Output,
	OutputType,
	TaskHandle,
	TextOutput,
	ToolResult,
	Usage,
} from "../lib/output";
export { primaryValue } from "../lib/output";
export type { SdkConfig } from "./client";
export {
	configure,
	getApiKey,
	getBaseUrl,
	getConfig,
	getManifest,
} from "./client";
export type { HandleResult } from "./handle";
export { arrayOf, Handle, isHandle, scalarOf } from "./handle";
export * from "./named-tools";
export type { RunOptions } from "./runner";
export { describeTool, run, runHandle } from "./runner";

/** Construct a Handle for the given tool. Equivalent to `sdk.<name>(input)`. */
export function tool(
	name: string,
	input: Record<string, unknown> = {},
): Handle {
	return new Handle(name, input);
}

/**
 * Convenience proxy: `sdk.seedream_4_5({...})` ≡ `tool("seedream_4_5", {...})`.
 *
 * The proxy doesn't validate the tool exists at call time; that happens when
 * you `run()` the resulting handle (so the manifest is only fetched lazily).
 */
type SdkProxy = Record<string, (input?: Record<string, unknown>) => Handle> & {
	run: typeof run;
	tool: typeof tool;
};

export const sdk: SdkProxy = new Proxy(
	{},
	{
		get(_target, prop) {
			if (prop === "run") return run;
			if (prop === "tool") return tool;
			if (prop === "then") return undefined; // not a thenable
			if (typeof prop !== "string") return undefined;
			return (input: Record<string, unknown> = {}) => new Handle(prop, input);
		},
	},
) as SdkProxy;

export default sdk;

// Re-export the low-level runner for advanced cases (e.g. cancelling a
// streaming run from outside).
export { runHandle as _runHandle };
