import * as fs from "node:fs";
import * as path from "node:path";
import { getMimeType } from "../utils/utils";
import { cliEndpoint } from "./endpoints";
import { debug } from "./envelope";

export type UploadContext = {
	apiKey: string;
	baseUrl: string;
};

function deriveUploadEndpoint(baseUrl: string): string {
	try {
		return cliEndpoint(new URL(baseUrl).origin, "/upload-url");
	} catch {
		return cliEndpoint(baseUrl, "/upload-url");
	}
}

async function fetchSignedUrl(
	ctx: UploadContext,
	filename: string,
	contentType: string,
): Promise<{ signedUrl: string; publicUrl: string }> {
	const endpoint = deriveUploadEndpoint(ctx.baseUrl);
	const resp = await fetch(endpoint, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${ctx.apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ filename, contentType }),
	});
	if (!resp.ok) {
		const body = await resp.text().catch(() => "");
		throw new Error(`signed url request failed (${resp.status}): ${body}`);
	}
	const json = (await resp.json()) as {
		signedUrl?: string;
		publicUrl?: string;
	};
	if (!json.signedUrl || !json.publicUrl) {
		throw new Error("invalid response from upload-url endpoint");
	}
	return { signedUrl: json.signedUrl, publicUrl: json.publicUrl };
}

async function putToSignedUrl(
	signedUrl: string,
	body: Buffer,
	contentType: string,
): Promise<void> {
	const resp = await fetch(signedUrl, {
		method: "PUT",
		headers: { "Content-Type": contentType },
		// Buffer is a Uint8Array subclass and works as BodyInit at runtime; the
		// cast is just to satisfy TS, which doesn't list Buffer in BodyInit.
		// Avoids the per-byte copy that `Uint8Array.from(body)` would do.
		body: body as unknown as BodyInit,
	});
	if (!resp.ok) {
		const text = await resp.text().catch(() => "");
		throw new Error(`upload failed (${resp.status}): ${text}`);
	}
}

export async function uploadBuffer(
	buf: Buffer,
	filename: string,
	contentType: string,
	ctx: UploadContext,
): Promise<string> {
	const { signedUrl, publicUrl } = await fetchSignedUrl(
		ctx,
		filename,
		contentType,
	);
	await putToSignedUrl(signedUrl, buf, contentType);
	debug("uploaded to s3", { publicUrl, size: buf.length });
	return publicUrl;
}

export async function uploadLocalFile(
	filePath: string,
	ctx: UploadContext,
): Promise<string> {
	const buf = fs.readFileSync(filePath);
	return uploadBuffer(buf, path.basename(filePath), getMimeType(filePath), ctx);
}

export function parseDataUrl(dataUrl: string): {
	mime: string;
	isBase64: boolean;
	data: string;
} {
	if (!dataUrl.startsWith("data:")) throw new Error("not a data URL");
	const commaIdx = dataUrl.indexOf(",");
	if (commaIdx === -1) throw new Error("invalid data URL");
	const meta = dataUrl.slice(5, commaIdx);
	const data = dataUrl.slice(commaIdx + 1);
	const segments = meta.split(";");
	const isBase64 = segments[segments.length - 1] === "base64";
	const mime = segments[0] || "application/octet-stream";
	return { mime, isBase64, data };
}

export async function uploadDataUrl(
	dataUrl: string,
	ctx: UploadContext,
): Promise<string> {
	const { mime, isBase64, data } = parseDataUrl(dataUrl);
	const buf = isBase64
		? Buffer.from(data, "base64")
		: Buffer.from(decodeURIComponent(data), "utf8");
	const sub = (mime.split("/")[1] || "bin").replace(/^x-/, "");
	const ext = sub === "jpeg" ? "jpg" : sub;
	return uploadBuffer(buf, `upload.${ext}`, mime, ctx);
}
