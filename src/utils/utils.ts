import * as mime from "mime-types";

export function getMimeType(filePath: string): string {
	return mime.lookup(filePath) || "application/octet-stream";
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
