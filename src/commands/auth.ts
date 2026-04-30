import type { Command } from "commander";
import { failure, log, success } from "../lib/envelope";
import { jsonResult } from "../lib/output";
import { t } from "../messages";
import { loadConfig, saveConfig, waitForApiKeyAuth } from "../utils/config";

/**
 * Mask an API key for display. Keeps the prefix (typically `sk-`) and the
 * last 4 characters; everything in between becomes `***`. Use --show on
 * `auth get` to reveal the raw value.
 */
function maskApiKey(key: string): string {
	if (key.length <= 8) return "***";
	const dash = key.indexOf("-");
	const prefix =
		dash >= 0 && dash <= 6 ? key.slice(0, dash + 1) : key.slice(0, 3);
	return `${prefix}***${key.slice(-4)}`;
}

export function registerAuthCommands(program: Command) {
	const msgs = t();

	const authCmd = program.command("auth").description(msgs.auth.description);

	authCmd
		.command("set <apiKey>")
		.description(msgs.auth.setDescription)
		.action((apiKey: string) => {
			const config = loadConfig();
			config.DLAZY_API_KEY = apiKey.trim();
			saveConfig(config);
			success(jsonResult("auth.set", { source: "config", saved: true }));
		});

	authCmd
		.command("get")
		.description(msgs.auth.getDescription)
		.option("--show", msgs.auth.getShowOption)
		.action((opts: { show?: boolean }) => {
			const reveal = (k: string) => (opts.show ? k : maskApiKey(k));
			const envKey = process.env.DLAZY_API_KEY;
			if (envKey) {
				return success(
					jsonResult("auth.get", { source: "env", apiKey: reveal(envKey) }),
				);
			}
			const config = loadConfig();
			if (config.DLAZY_API_KEY) {
				return success(
					jsonResult("auth.get", {
						source: "config",
						apiKey: reveal(config.DLAZY_API_KEY),
					}),
				);
			}
			return failure("not_configured", t().auth.notConfigured);
		});

	program
		.command("login")
		.description(msgs.auth.loginDescription)
		.option("--local", msgs.auth.localOption)
		.action(async (options) => {
			try {
				const fetchedKey = await waitForApiKeyAuth({ local: options.local });
				const config = loadConfig();
				config.DLAZY_API_KEY = fetchedKey;
				saveConfig(config);
				log(t().auth.loginSuccess);
				success(jsonResult("login", { saved: true }));
			} catch (err) {
				return failure("login_failed", (err as Error).message);
			}
		});

	program
		.command("logout")
		.description(msgs.auth.logoutDescription)
		.action(() => {
			const config = loadConfig();
			const had = "DLAZY_API_KEY" in config;
			if (had) {
				delete config.DLAZY_API_KEY;
				saveConfig(config);
				log(t().auth.logoutSuccess);
			} else {
				log(t().auth.logoutNothing);
			}
			if (process.env.DLAZY_API_KEY) {
				log(t().auth.logoutEnvWarning);
			}
			success(jsonResult("logout", { removed: had }));
		});
}
