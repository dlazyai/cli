import { exec } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";
import * as url from "node:url";

const CONFIG_DIR = path.join(os.homedir(), ".dlazy");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

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

export function waitForApiKeyAuth(options?: {
	local?: boolean;
}): Promise<string> {
	return new Promise((resolve, reject) => {
		const server = http.createServer((req, res) => {
			const parsedUrl = new url.URL(
				req.url || "",
				`http://${req.headers.host}`,
			);
			if (parsedUrl.pathname === "/callback") {
				const token = parsedUrl.searchParams.get("token");
				if (token) {
					res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
					res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>dLazy CLI Authentication</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      height: 100vh;
      padding-top: 100px;
    }
    .container {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      width: 450px;
      max-width: 90vw;
    }
    h2 {
      margin: 0 0 10px;
      font-size: 16px;
      color: #111827;
      font-weight: 700;
    }
    p {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Authentication Successful!</h2>
    <p>You can close this window and return to your terminal.</p>
  </div>
  <script>setTimeout(() => window.close(), 3000)</script>
</body>
</html>
					`);
					server.close(() => resolve(token));
				} else {
					res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
					res.end("<h1>Authentication Failed: Token not found.</h1>");
					server.close(() => reject(new Error("No token provided")));
				}
			} else {
				res.writeHead(404);
				res.end();
			}
		});

		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (!address || typeof address === "string") {
				reject(new Error("Failed to get server port"));
				return;
			}
			const port = address.port;
			const callbackUrl = encodeURIComponent(
				`http://127.0.0.1:${port}/callback`,
			);

			// For local testing, if the env variable is set, use local address, otherwise use online address
			let baseUrl = process.env.DLAZY_BASE_URL || "https://dlazy.com";
			if (options?.local) {
				baseUrl = "http://localhost:3000";
			}

			// Extract the origin address from BASE_URL
			let originUrl = "https://dlazy.com";
			try {
				const parsedBase = new url.URL(baseUrl);
				originUrl = parsedBase.origin;
			} catch (_e) {
				// ignore
			}

			const authUrl = `${originUrl}/auth/cli?callbackUrl=${callbackUrl}`;

			console.log("\n[dLazy CLI] Starting authentication process...");
			console.log(
				`Your browser will open shortly to authenticate at ${originUrl}...`,
			);
			console.log(
				`If the browser does not open automatically, please visit the following link manually:\n${authUrl}\n`,
			);

			openBrowser(authUrl);
		});

		server.on("error", (e) => {
			reject(e);
		});
	});
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
 * 4. interactive browser auth (only if TTY is available)
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
		console.error(
			"No API key. Set DLAZY_API_KEY, pass --api-key, or run `dlazy login` in an interactive shell.",
		);
		process.exit(1);
	}
	return key;
}
