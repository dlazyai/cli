import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	parseDataUrl,
	type UploadContext,
	uploadBuffer,
	uploadDataUrl,
	uploadLocalFile,
} from "../src/lib/upload";

const CTX: UploadContext = {
	apiKey: "dl-test-key",
	baseUrl: "https://example.com/api/ai/tool",
};

const SIGNED_URL = "https://signed.example.com/put?sig=abc";
const PUBLIC_URL = "https://cdn.example.com/uploads/abc.png";

type FetchMock = ReturnType<typeof vi.fn>;

function mockFetchSequence(responses: Array<Partial<Response>>): FetchMock {
	const fn = vi.fn();
	for (const r of responses) {
		fn.mockResolvedValueOnce({
			ok: r.ok ?? true,
			status: r.status ?? 200,
			text: r.text ?? (async () => ""),
			json: r.json ?? (async () => ({})),
			...r,
		});
	}
	globalThis.fetch = fn as unknown as typeof fetch;
	return fn;
}

beforeEach(() => {
	vi.restoreAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe.sequential("parseDataUrl", () => {
	it("parses a base64 data URL with mime type", () => {
		const result = parseDataUrl(
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA",
		);
		expect(result).toEqual({
			mime: "image/png",
			isBase64: true,
			data: "iVBORw0KGgoAAAANSUhEUgAA",
		});
	});

	it("parses a non-base64 (URL-encoded) data URL", () => {
		const result = parseDataUrl("data:text/plain,Hello%20World");
		expect(result).toEqual({
			mime: "text/plain",
			isBase64: false,
			data: "Hello%20World",
		});
	});

	it("preserves params in mediatype but still detects base64", () => {
		const result = parseDataUrl(
			"data:text/plain;charset=utf-8;base64,SGVsbG8=",
		);
		expect(result.mime).toBe("text/plain");
		expect(result.isBase64).toBe(true);
		expect(result.data).toBe("SGVsbG8=");
	});

	it("falls back to octet-stream when mediatype is empty", () => {
		const result = parseDataUrl("data:;base64,SGVsbG8=");
		expect(result.mime).toBe("application/octet-stream");
		expect(result.isBase64).toBe(true);
	});

	it("throws on non-data URLs", () => {
		expect(() => parseDataUrl("https://example.com/x.png")).toThrow(
			/not a data URL/,
		);
	});

	it("throws when comma is missing", () => {
		expect(() => parseDataUrl("data:image/png;base64")).toThrow(
			/invalid data URL/,
		);
	});
});

describe.sequential("uploadBuffer", () => {
	it("requests signed url then PUTs the buffer and returns publicUrl", async () => {
		const fetchMock = mockFetchSequence([
			{
				ok: true,
				json: async () => ({ signedUrl: SIGNED_URL, publicUrl: PUBLIC_URL }),
			},
			{ ok: true, status: 200 },
		]);

		const buf = Buffer.from([1, 2, 3, 4]);
		const result = await uploadBuffer(buf, "foo.png", "image/png", CTX);

		expect(result).toBe(PUBLIC_URL);
		expect(fetchMock).toHaveBeenCalledTimes(2);

		const [signEndpoint, signInit] = fetchMock.mock.calls[0]!;
		expect(signEndpoint).toBe("https://example.com/api/cli/upload-url");
		expect(signInit.method).toBe("POST");
		expect(signInit.headers.Authorization).toBe("Bearer dl-test-key");
		expect(signInit.headers["Content-Type"]).toBe("application/json");
		expect(JSON.parse(signInit.body)).toEqual({
			filename: "foo.png",
			contentType: "image/png",
		});

		const [putUrl, putInit] = fetchMock.mock.calls[1]!;
		expect(putUrl).toBe(SIGNED_URL);
		expect(putInit.method).toBe("PUT");
		expect(putInit.headers["Content-Type"]).toBe("image/png");
		expect(putInit.body).toBe(buf);
	});

	it("derives upload endpoint from baseUrl origin (no /api/ai/tool path)", async () => {
		const fetchMock = mockFetchSequence([
			{
				ok: true,
				json: async () => ({ signedUrl: SIGNED_URL, publicUrl: PUBLIC_URL }),
			},
			{ ok: true },
		]);

		await uploadBuffer(Buffer.from("x"), "x.txt", "text/plain", {
			apiKey: "k",
			baseUrl: "http://localhost:3000",
		});

		expect(fetchMock.mock.calls[0]![0]).toBe(
			"http://localhost:3000/api/cli/upload-url",
		);
	});

	it("throws when sign request fails", async () => {
		mockFetchSequence([
			{ ok: false, status: 401, text: async () => "no auth" },
		]);

		await expect(
			uploadBuffer(Buffer.from("x"), "x.png", "image/png", CTX),
		).rejects.toThrow(/signed url request failed \(401\)/);
	});

	it("throws when sign response is missing fields", async () => {
		mockFetchSequence([{ ok: true, json: async () => ({}) }]);

		await expect(
			uploadBuffer(Buffer.from("x"), "x.png", "image/png", CTX),
		).rejects.toThrow(/invalid response/);
	});

	it("throws when PUT to signed url fails", async () => {
		mockFetchSequence([
			{
				ok: true,
				json: async () => ({ signedUrl: SIGNED_URL, publicUrl: PUBLIC_URL }),
			},
			{ ok: false, status: 403, text: async () => "forbidden" },
		]);

		await expect(
			uploadBuffer(Buffer.from("x"), "x.png", "image/png", CTX),
		).rejects.toThrow(/upload failed \(403\)/);
	});
});

describe.sequential("uploadLocalFile", () => {
	it("reads the file, infers mime, and uploads", async () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-upload-"));
		const tmpFile = path.join(tmpDir, "photo.jpg");
		const contents = "local-content";
		fs.writeFileSync(tmpFile, contents);

		try {
			const fetchMock = mockFetchSequence([
				{
					ok: true,
					json: async () => ({
						signedUrl: SIGNED_URL,
						publicUrl: PUBLIC_URL,
					}),
				},
				{ ok: true },
			]);

			const result = await uploadLocalFile(tmpFile, CTX);
			expect(result).toBe(PUBLIC_URL);

			const signBody = JSON.parse(fetchMock.mock.calls[0]![1].body);
			expect(signBody.filename).toBe("photo.jpg");
			expect(signBody.contentType).toBe("image/jpeg");

			const putBody = fetchMock.mock.calls[1]![1].body as Buffer;
			expect(putBody.toString("utf8")).toBe(contents);
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});

describe.sequential("uploadDataUrl", () => {
	it("decodes a base64 data URL and uploads", async () => {
		const fetchMock = mockFetchSequence([
			{
				ok: true,
				json: async () => ({ signedUrl: SIGNED_URL, publicUrl: PUBLIC_URL }),
			},
			{ ok: true },
		]);

		// "Hello" in base64
		const result = await uploadDataUrl("data:image/png;base64,SGVsbG8=", CTX);
		expect(result).toBe(PUBLIC_URL);

		const signBody = JSON.parse(fetchMock.mock.calls[0]![1].body);
		expect(signBody.contentType).toBe("image/png");
		expect(signBody.filename).toBe("upload.png");

		const putBuf = fetchMock.mock.calls[1]![1].body as Buffer;
		expect(putBuf.toString("utf8")).toBe("Hello");
	});

	it("normalizes jpeg → jpg in synthesized filename", async () => {
		const fetchMock = mockFetchSequence([
			{
				ok: true,
				json: async () => ({ signedUrl: SIGNED_URL, publicUrl: PUBLIC_URL }),
			},
			{ ok: true },
		]);

		await uploadDataUrl("data:image/jpeg;base64,SGVsbG8=", CTX);

		const signBody = JSON.parse(fetchMock.mock.calls[0]![1].body);
		expect(signBody.filename).toBe("upload.jpg");
	});

	it("decodes URL-encoded (non-base64) data URL", async () => {
		const fetchMock = mockFetchSequence([
			{
				ok: true,
				json: async () => ({ signedUrl: SIGNED_URL, publicUrl: PUBLIC_URL }),
			},
			{ ok: true },
		]);

		await uploadDataUrl("data:text/plain,Hello%20World", CTX);

		const putBuf = fetchMock.mock.calls[1]![1].body as Buffer;
		expect(putBuf.toString("utf8")).toBe("Hello World");
	});
});
