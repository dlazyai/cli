import * as fs from "node:fs";
import * as mime from "mime-types";

export function encodeFileToBase64(filePath: string): string {
	const data = fs.readFileSync(filePath);
	return data.toString("base64");
}

export function getMimeType(filePath: string): string {
	return mime.lookup(filePath) || "application/octet-stream";
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
