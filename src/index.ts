#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../package.json";
import { registerAuthCommands } from "./commands/auth";
import { registerToolCommands } from "./commands/tools";
import { resolveLocale, SUPPORTED_LOCALES, setLocale, t } from "./messages";

// Resolve locale before registering commands so commander descriptions pick up
// the translated text at definition time.
setLocale(resolveLocale(process.argv));

const msgs = t();

const program = new Command();

program
	.name("dlazy")
	.description(msgs.cli.description)
	.version(version)
	.option("--api-key <key>", msgs.cli.apiKeyOption)
	.option("--base-url <url>", msgs.cli.baseUrlOption)
	.option("--verbose", msgs.cli.verboseOption)
	.option("-l, --lang <locale>", msgs.cli.langOption, (value) => {
		if (!(SUPPORTED_LOCALES as readonly string[]).includes(value)) {
			throw new Error(
				`Unsupported locale: ${value}. Supported: ${SUPPORTED_LOCALES.join(", ")}`,
			);
		}
		setLocale(value);
		return value;
	});

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
