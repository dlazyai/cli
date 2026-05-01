/**
 * CLI-only API base path. All endpoints the CLI calls live under this prefix
 * on the server (`app/api/cli/*`). Bumping a server endpoint? Update here.
 */
export const CLI_API_BASE = "/api/cli";

function trimSlash(s: string): string {
	return s.replace(/\/+$/, "");
}

export function cliEndpoint(baseUrl: string, path: string): string {
	const cleanBase = trimSlash(baseUrl);
	const cleanPath = path.startsWith("/") ? path : `/${path}`;
	return `${cleanBase}${CLI_API_BASE}${cleanPath}`;
}
