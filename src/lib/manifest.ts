import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { version as CLI_VERSION } from "../../package.json";
import type { Locale } from "../messages";
import { cliEndpoint } from "./endpoints";
import { debug } from "./envelope";

export type ManifestTool = {
	id: string;
	cli_name: string;
	type: "text" | "image" | "video" | "audio" | "tool" | "auto";
	description: string;
	runMode: "task" | "local";
	asynchronous: boolean;
	tier: string | null;
	hasCosts: boolean;
	hasDurationEstimation: boolean;
	inputJsonSchema: unknown;
	outputJsonSchema: unknown;
};

export type Manifest = {
	locale: Locale;
	tools: ManifestTool[];
};

const CACHE_DIR = path.join(os.homedir(), ".dlazy");
const FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

type CachedManifest = Manifest & { _cachedAt?: number };

function cachePath(locale: Locale): string {
	return path.join(CACHE_DIR, `manifest-${locale}.json`);
}

function readCache(locale: Locale): CachedManifest | null {
	const p = cachePath(locale);
	if (!fs.existsSync(p)) return null;
	try {
		return JSON.parse(fs.readFileSync(p, "utf8")) as CachedManifest;
	} catch {
		return null;
	}
}

function writeCache(locale: Locale, manifest: Manifest) {
	try {
		if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
		const stamped: CachedManifest = { ...manifest, _cachedAt: Date.now() };
		fs.writeFileSync(cachePath(locale), JSON.stringify(stamped), "utf8");
	} catch (err) {
		debug("manifest cache write failed", (err as Error).message);
	}
}

async function fetchFresh(
	baseUrl: string,
	locale: Locale,
): Promise<Manifest | null> {
	const url = `${cliEndpoint(baseUrl, "/tool/manifest")}?locale=${encodeURIComponent(locale)}`;
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
	try {
		const resp = await fetch(url, {
			signal: ctrl.signal,
			headers: { "X-CLI-Version": CLI_VERSION },
		});
		if (!resp.ok) {
			debug("manifest fetch http error", resp.status);
			return null;
		}
		return (await resp.json()) as Manifest;
	} catch (err) {
		debug("manifest fetch failed", (err as Error).message);
		return null;
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Load the tool manifest. Cache-first with background refresh:
 *
 *  - Fresh on-disk cache (< 24h)  → return immediately, refresh in background.
 *  - Stale or missing cache       → fetch synchronously, fall back to stale
 *                                   cache if the network is unavailable.
 *  - No cache and no network      → empty manifest (commands needing tools
 *                                   surface a clear error at execution time).
 *
 * This keeps `dlazy --help` snappy on slow / offline networks.
 */
export async function loadManifest(
	baseUrl: string,
	locale: Locale,
): Promise<Manifest> {
	const cached = readCache(locale);
	const isFresh =
		cached?._cachedAt && Date.now() - cached._cachedAt < CACHE_TTL_MS;

	if (cached && isFresh) {
		// Fire-and-forget refresh; errors are silent and only logged via debug().
		void fetchFresh(baseUrl, locale).then((fresh) => {
			if (fresh) writeCache(locale, fresh);
		});
		const { _cachedAt: _, ...manifest } = cached;
		return manifest;
	}

	const fresh = await fetchFresh(baseUrl, locale);
	if (fresh) {
		writeCache(locale, fresh);
		return fresh;
	}
	if (cached) {
		const { _cachedAt: _, ...manifest } = cached;
		return manifest;
	}
	return { locale, tools: [] };
}
