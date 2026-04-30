#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../package.json";
import { registerAuthCommands } from "./commands/auth";
import { registerToolCommands } from "./commands/tools";
import { type OutputMode, setOutputMode, setVerbose } from "./lib/envelope";
import { resolveLocale, SUPPORTED_LOCALES, setLocale, t } from "./messages";
import { peekFlagBool, peekFlagValue } from "./utils/argv";

// Resolve locale before registering commands so commander descriptions pick up
// the translated text at definition time.
setLocale(resolveLocale(process.argv));

// `--output`, `--verbose`: must take effect before any subcommand runs
// (success/failure emit synchronously, debug() is gated by verbose).
const VALID_MODES: ReadonlySet<OutputMode> = new Set(["json", "url", "text"]);
const peekedOutput = peekFlagValue(process.argv, "output");
if (peekedOutput && VALID_MODES.has(peekedOutput as OutputMode)) {
	setOutputMode(peekedOutput as OutputMode);
}
if (peekFlagBool(process.argv, "verbose")) setVerbose(true);

const msgs = t();

const program = new Command();

program
	.name("dlazy")
	.description(msgs.cli.description)
	.version(version)
	.option("--api-key <key>", msgs.cli.apiKeyOption)
	.option("--base-url <url>", msgs.cli.baseUrlOption)
	.option("--verbose", msgs.cli.verboseOption)
	.option(
		"--output <mode>",
		"stdout format: json (default) | url | text",
		(value) => {
			if (!VALID_MODES.has(value as OutputMode)) {
				throw new Error(
					`Unsupported --output mode: ${value}. Supported: json, url, text`,
				);
			}
			setOutputMode(value as OutputMode);
			return value;
		},
	)
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

(async () => {
	await registerToolCommands(program);
	if (!process.argv.slice(2).length) {
		program.outputHelp();
		return;
	}
	await program.parseAsync(process.argv);
})().catch((err) => {
	process.stdout.write(
		`${JSON.stringify({
			ok: false,
			code: "internal_error",
			message: err instanceof Error ? err.message : String(err),
		})}\n`,
	);
	process.exit(1);
});
