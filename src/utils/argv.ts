/**
 * Argv peek helpers — used to resolve flags BEFORE commander parses, e.g.
 * locale (so command descriptions are translated), --output (so emits go to
 * the right shape), --base-url (so we can fetch the manifest at register-time),
 * --verbose (so debug() during manifest load is honored).
 *
 * The peek is intentionally permissive: unknown / malformed flags fall back
 * to env / defaults; commander remains the source of truth once it parses.
 */

/** Returns the value of `--<name> <v>` or `--<name>=<v>`, or undefined. */
export function peekFlagValue(
	argv: readonly string[],
	name: string,
): string | undefined {
	const long = `--${name}`;
	const longEq = `${long}=`;
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === long) return argv[i + 1];
		if (a?.startsWith(longEq)) return a.slice(longEq.length);
	}
	return undefined;
}

/** True if `--<name>` appears anywhere in argv (boolean flag). */
export function peekFlagBool(argv: readonly string[], name: string): boolean {
	const long = `--${name}`;
	for (const a of argv) {
		if (a === long) return true;
	}
	return false;
}
