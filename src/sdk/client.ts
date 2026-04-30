import {
	loadManifest,
	type Manifest,
	type ManifestTool,
} from "../lib/manifest";
import { getLocale } from "../messages";
import { isHeadless, resolveApiKey } from "../utils/config";

export type SdkConfig = {
	apiKey?: string;
	baseUrl?: string;
	organizationId?: string;
	projectId?: string;
	/** Skip interactive auth and headless detection; throw if no key. */
	noInteractive?: boolean;
};

const state: {
	config: SdkConfig;
	manifest: Manifest | null;
	manifestPromise: Promise<Manifest> | null;
	apiKey: string | null;
	apiKeyPromise: Promise<string> | null;
} = {
	config: {},
	manifest: null,
	manifestPromise: null,
	apiKey: null,
	apiKeyPromise: null,
};

/**
 * Update SDK config. Subsequent run() calls pick up the new values.
 *
 * Defaults: baseUrl from DLAZY_BASE_URL env or https://dlazy.com; apiKey
 * from DLAZY_API_KEY env or ~/.dlazy/config.json (interactive login if TTY).
 */
export function configure(c: SdkConfig): void {
	Object.assign(state.config, c);
	// Invalidate cached values that depend on config.
	if (c.apiKey !== undefined) {
		state.apiKey = c.apiKey || null;
		state.apiKeyPromise = null;
	}
	if (c.baseUrl !== undefined) {
		state.manifest = null;
		state.manifestPromise = null;
	}
}

export function getConfig(): Readonly<SdkConfig> {
	return state.config;
}

export function getBaseUrl(): string {
	const url =
		state.config.baseUrl || process.env.DLAZY_BASE_URL || "https://dlazy.com";
	return url.replace(/\/+$/, "");
}

export async function getApiKey(): Promise<string> {
	if (state.apiKey) return state.apiKey;
	if (state.apiKeyPromise) return state.apiKeyPromise;
	state.apiKeyPromise = (async () => {
		const interactive =
			state.config.noInteractive === true ? false : !isHeadless();
		const key = await resolveApiKey(state.config.apiKey, { interactive });
		if (!key) {
			throw new Error(
				"No API key. Set DLAZY_API_KEY env, run `dlazy login`, or call configure({ apiKey }).",
			);
		}
		state.apiKey = key;
		return key;
	})();
	return state.apiKeyPromise;
}

export async function getManifest(): Promise<Manifest> {
	if (state.manifest) return state.manifest;
	if (state.manifestPromise) return state.manifestPromise;
	state.manifestPromise = (async () => {
		const m = await loadManifest(getBaseUrl(), getLocale());
		state.manifest = m;
		return m;
	})();
	return state.manifestPromise;
}

/**
 * Map an SDK identifier (`seedream_4_5`) or raw cli_name (`seedream-4.5`)
 * to the manifest tool record.
 */
export function findTool(
	manifest: Manifest,
	name: string,
): ManifestTool | undefined {
	// Exact cli_name first.
	let hit = manifest.tools.find((t) => t.cli_name === name);
	if (hit) return hit;
	// Identifier-safe form: `-` and `.` replaced with `_`.
	const norm = (s: string) => s.replace(/[-.]/g, "_");
	const target = norm(name);
	hit = manifest.tools.find((t) => norm(t.cli_name) === target);
	if (hit) return hit;
	// Fallback: model id.
	return manifest.tools.find((t) => t.id === name);
}

/** Reset cached state — exposed for tests. */
export function _resetSdkState(): void {
	state.config = {};
	state.manifest = null;
	state.manifestPromise = null;
	state.apiKey = null;
	state.apiKeyPromise = null;
}
