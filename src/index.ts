#!/usr/bin/env node

import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth";
import { registerToolCommands } from "./commands/tools";

const program = new Command();

program
	.name("dlazy")
	.description(
		"AI tool runner. Emits JSON envelopes on stdout; logs on stderr.",
	)
	.version("1.0.0")
	.option("--api-key <key>", "API key (overrides DLAZY_API_KEY and config)")
	.option("--base-url <url>", "API base URL (overrides DLAZY_BASE_URL)")
	.option("--verbose", "Enable debug logging on stderr");

registerAuthCommands(program);
registerToolCommands(program);

program.parseAsync(process.argv).catch((err) => {
	process.stdout.write(
		`${JSON.stringify({
			ok: false,
			code: "internal_error",
			message: err instanceof Error ? err.message : String(err),
		})}\n`,
	);
	process.exit(1);
});

if (!process.argv.slice(2).length) {
	program.outputHelp();
}
