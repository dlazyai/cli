import { exec } from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { t } from "../messages";
import { sleep } from "./utils";

const CONFIG_DIR = path.join(os.homedir(), ".dlazy");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const DEFAULT_EXPIRES_IN_MINUTES = 30;
const POLL_INTERVAL_MS = 2000;

export function openBrowser(urlToOpen: string) {
	const platform = os.platform();
	if (platform === "win32") {
		exec(`start "" "${urlToOpen}"`);
	} else if (platform === "darwin") {
		exec(`open "${urlToOpen}"`);
	} else {
		exec(`xdg-open "${urlToOpen}"`);
	}
}

export function loadConfig(): Record<string, any> {
	if (fs.existsSync(CONFIG_FILE)) {
		try {
			return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
		} catch (_e) {
			return {};
		}
	}
	return {};
}

export function saveConfig(config: Record<string, any>) {
	if (!fs.existsSync(CONFIG_DIR)) {
		fs.mkdirSync(CONFIG_DIR, { recursive: true });
	}
	fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

function base64UrlEncode(buf: Buffer): string {
	return buf
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

function buildDeviceToken(expiresInMinutes: number): string {
	const payload = {
		id: crypto.randomUUID(),
		expires_in: expiresInMinutes,
	};
	return base64UrlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
}

function resolveBaseUrl(local?: boolean): string {
	if (local) return "http://localhost:3000";
	return process.env.DLAZY_BASE_URL || "https://dlazy.com";
}

export async function waitForApiKeyAuth(options?: {
	local?: boolean;
	expiresInMinutes?: number;
}): Promise<string> {
	const msgs = t().config;
	const expiresInMinutes =
		options?.expiresInMinutes ?? DEFAULT_EXPIRES_IN_MINUTES;
	const token = buildDeviceToken(expiresInMinutes);
	const baseUrl = resolveBaseUrl(options?.local);
	const verificationUri = `${baseUrl}/auth/cli?token=${encodeURIComponent(token)}`;
	const pollUrl = `${baseUrl}/api/cli/verification?token=${encodeURIComponent(token)}`;

	console.log(msgs.startingAuth);
	console.log(msgs.visitToAuthorize(verificationUri));
	console.log(msgs.pollingNotice(expiresInMinutes));

	openBrowser(verificationUri);

	const deadline = Date.now() + expiresInMinutes * 60 * 1000;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(pollUrl, {
				method: "GET",
				headers: { Accept: "application/json" },
			});
			if (res.ok) {
				const body = (await res.json()) as {
					apiKey?: string;
					status?: string;
				};
				if (body.apiKey) return body.apiKey;
				if (body.status === "expired") {
					throw new Error(msgs.authExpired);
				}
			} else if (res.status === 410 || res.status === 404) {
				throw new Error(msgs.authExpired);
			}
		} catch (err) {
			if ((err as Error).message === msgs.authExpired) throw err;
			// transient network/JSON errors: keep polling until deadline
		}
		await sleep(POLL_INTERVAL_MS);
	}

	throw new Error(msgs.authTimeout(expiresInMinutes));
}

export function getApiKeySync(): string | null {
	const apiKey = process.env.DLAZY_API_KEY;
	if (apiKey) return apiKey;

	const config = loadConfig();
	if (config.DLAZY_API_KEY) return config.DLAZY_API_KEY;

	return null;
}

export function isHeadless(): boolean {
	if (process.env.CI) return true;
	return !process.stdin.isTTY || !process.stdout.isTTY;
}

/**
 * Resolve an API key from (in order):
 * 1. explicit `override` (e.g. --api-key flag)
 * 2. DLAZY_API_KEY env var
 * 3. ~/.dlazy/config.json
 * 4. interactive device-code auth (only if TTY is available)
 *
 * Returns null if not available and interactive login is not possible.
 */
export async function resolveApiKey(
	override?: string,
	opts: { interactive?: boolean } = {},
): Promise<string | null> {
	if (override) return override;
	const cached = getApiKeySync();
	if (cached) return cached;
	if (opts.interactive === false || isHeadless()) return null;
	const fetched = await waitForApiKeyAuth();
	const config = loadConfig();
	config.DLAZY_API_KEY = fetched;
	saveConfig(config);
	return fetched;
}

/**
 * @deprecated use resolveApiKey; kept for backward compat with existing auth command.
 */
export async function ensureApiKey(): Promise<string> {
	const key = await resolveApiKey();
	if (!key) {
		console.error(t().auth.noApiKeyExit);
		process.exit(1);
	}
	return key;
}
