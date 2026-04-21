import type { Command } from "commander";
import { failure, log, success } from "../lib/envelope";
import {
	isHeadless,
	loadConfig,
	saveConfig,
	waitForApiKeyAuth,
} from "../utils/config";

export function registerAuthCommands(program: Command) {
	const authCmd = program
		.command("auth")
		.description("Manage authentication configuration");

	authCmd
		.command("set <apiKey>")
		.description("Set your DLAZY_API_KEY manually")
		.action((apiKey: string) => {
			const config = loadConfig();
			config.DLAZY_API_KEY = apiKey.trim();
			saveConfig(config);
			success("raw", { source: "config", saved: true });
		});

	authCmd
		.command("get")
		.description("Get the currently configured DLAZY_API_KEY")
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
			return failure("not_configured", "API key is not set");
		});

	program
		.command("login")
		.description("Log in via browser (interactive only)")
		.option("--local", "Use localhost:3000 for local testing")
		.action(async (options) => {
			if (isHeadless()) {
				return failure(
					"headless_environment",
					"Browser login requires an interactive terminal. Use `dlazy auth set <key>` or set DLAZY_API_KEY.",
				);
			}
			try {
				const fetchedKey = await waitForApiKeyAuth({ local: options.local });
				const config = loadConfig();
				config.DLAZY_API_KEY = fetchedKey;
				saveConfig(config);
				log("login successful; api key saved to config");
				success("raw", { saved: true });
			} catch (err) {
				return failure("login_failed", (err as Error).message);
			}
		});
}
