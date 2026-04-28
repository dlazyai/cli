import type { Command } from "commander";
import { failure, log, success } from "../lib/envelope";
import { t } from "../messages";
import { loadConfig, saveConfig, waitForApiKeyAuth } from "../utils/config";

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
			success("raw", { source: "config", saved: true });
		});

	authCmd
		.command("get")
		.description(msgs.auth.getDescription)
		.action(() => {
			const envKey = process.env.DLAZY_API_KEY;
			if (envKey) {
				return success("raw", { source: "env", apiKey: envKey });
			}
			const config = loadConfig();
			if (config.DLAZY_API_KEY) {
				return success("raw", {
					source: "config",
					apiKey: config.DLAZY_API_KEY,
				});
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
				success("raw", { saved: true });
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
			success("raw", { removed: had });
		});
}
