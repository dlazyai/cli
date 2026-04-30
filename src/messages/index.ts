import { peekFlagValue } from "../utils/argv";
import { messages as enUS } from "./en-US";
import {
	DEFAULT_LOCALE,
	type Locale,
	type Messages,
	SUPPORTED_LOCALES,
} from "./types";
import { messages as zhCN } from "./zh-CN";

const REGISTRY: Record<Locale, Messages> = {
	"en-US": enUS,
	"zh-CN": zhCN,
};

let currentLocale: Locale = DEFAULT_LOCALE;

function normalizeLocale(raw: string | undefined | null): Locale | undefined {
	if (!raw) return undefined;
	const lower = raw.toLowerCase();
	if (lower.startsWith("zh")) return "zh-CN";
	if (lower.startsWith("en")) return "en-US";
	return undefined;
}

/**
 * Resolve locale (highest priority first):
 *   1. --lang / -l CLI flag (scanned directly from argv to run before commander)
 *   2. DLAZY_LANG env var
 *   3. LANG / LC_ALL env var
 *   4. DEFAULT_LOCALE
 */
export function resolveLocale(argv: readonly string[] = process.argv): Locale {
	const flagLong = peekFlagValue(argv, "lang");
	const flagShort = ((): string | undefined => {
		for (let i = 0; i < argv.length; i++)
			if (argv[i] === "-l") return argv[i + 1];
		return undefined;
	})();
	const flagValue = flagLong ?? flagShort;
	const flagLocale = normalizeLocale(flagValue);
	if (flagLocale) return flagLocale;

	const envLocale =
		normalizeLocale(process.env.DLAZY_LANG) ||
		normalizeLocale(process.env.LC_ALL) ||
		normalizeLocale(process.env.LANG);
	return envLocale ?? DEFAULT_LOCALE;
}

export function setLocale(locale: string | Locale) {
	const n = normalizeLocale(locale);
	currentLocale = n ?? DEFAULT_LOCALE;
}

export function getLocale(): Locale {
	return currentLocale;
}

export function t(): Messages {
	return REGISTRY[currentLocale] ?? REGISTRY[DEFAULT_LOCALE];
}

export { SUPPORTED_LOCALES, DEFAULT_LOCALE };
export type { Locale, Messages };
