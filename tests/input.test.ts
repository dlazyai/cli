import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildInput,
	resolveFileValue,
	resolveMediaFields,
} from "../src/lib/input";
import type { FieldDescriptor } from "../src/lib/schema";
import type { UploadContext } from "../src/lib/upload";
import * as upload from "../src/lib/upload";

const CTX: UploadContext = {
	apiKey: "dl-test-key",
	baseUrl: "https://example.com/api/ai/tool",
};

const PUBLIC_URL = "https://cdn.example.com/uploads/abc.png";

const imageField: FieldDescriptor = {
	key: "image",
	required: true,
	isArray: false,
	mediaType: "image",
	description: "input image",
};

const imagesField: FieldDescriptor = {
	key: "images",
	required: true,
	isArray: true,
	mediaType: "image",
	description: "input images",
};

const promptField: FieldDescriptor = {
	key: "prompt",
	required: true,
	isArray: false,
	description: "text prompt",
};

beforeEach(() => {
	vi.restoreAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe.sequential("buildInput", () => {
	it("merges explicit input and flag values, flags winning", () => {
		const result = buildInput({
			fields: [promptField, imageField],
			flagValues: { prompt: "from-flag" },
			explicitInput: { prompt: "from-input", image: "https://x/y.png" },
		});
		expect(result).toEqual({
			prompt: "from-flag",
			image: "https://x/y.png",
		});
	});

	it("does not resolve media fields (returns raw values)", () => {
		const result = buildInput({
			fields: [imageField],
			flagValues: { image: "/tmp/local.png" },
		});
		expect(result).toEqual({ image: "/tmp/local.png" });
	});

	it("ignores undefined flag values", () => {
		const result = buildInput({
			fields: [promptField, imageField],
			flagValues: { prompt: "hi" },
			explicitInput: { image: "https://x/y.png" },
		});
		expect(result).toEqual({
			prompt: "hi",
			image: "https://x/y.png",
		});
	});
});

describe.sequential("resolveFileValue", () => {
	it("passes http(s) URLs through unchanged", async () => {
		const spy = vi.spyOn(upload, "uploadLocalFile");
		expect(await resolveFileValue("https://x.com/a.png", "image", CTX)).toBe(
			"https://x.com/a.png",
		);
		expect(await resolveFileValue("http://x.com/a.png", "image", CTX)).toBe(
			"http://x.com/a.png",
		);
		expect(spy).not.toHaveBeenCalled();
	});

	it("uploads data URLs to storage and returns public URL", async () => {
		const spy = vi.spyOn(upload, "uploadDataUrl").mockResolvedValue(PUBLIC_URL);

		const result = await resolveFileValue(
			"data:image/png;base64,SGVsbG8=",
			"image",
			CTX,
		);
		expect(result).toBe(PUBLIC_URL);
		expect(spy).toHaveBeenCalledWith("data:image/png;base64,SGVsbG8=", CTX);
	});

	it("uploads local files to storage and returns public URL", async () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-input-"));
		const tmpFile = path.join(tmpDir, "photo.png");
		fs.writeFileSync(tmpFile, "x");

		try {
			const spy = vi
				.spyOn(upload, "uploadLocalFile")
				.mockResolvedValue(PUBLIC_URL);

			const result = await resolveFileValue(tmpFile, "image", CTX);
			expect(result).toBe(PUBLIC_URL);
			expect(spy).toHaveBeenCalledTimes(1);
			// resolveFileValue resolves to absolute path before uploading
			expect(spy.mock.calls[0]![0]).toBe(tmpFile);
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});

describe.sequential("resolveMediaFields", () => {
	it("leaves non-media fields untouched", async () => {
		const out = await resolveMediaFields(
			{ prompt: "hello" },
			[promptField],
			CTX,
		);
		expect(out).toEqual({ prompt: "hello" });
	});

	it("resolves a single media field via uploadDataUrl", async () => {
		const spy = vi.spyOn(upload, "uploadDataUrl").mockResolvedValue(PUBLIC_URL);

		const out = await resolveMediaFields(
			{ image: "data:image/png;base64,SGVsbG8=" },
			[imageField],
			CTX,
		);
		expect(out).toEqual({ image: PUBLIC_URL });
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it("passes http URLs through without uploading", async () => {
		const dataSpy = vi.spyOn(upload, "uploadDataUrl");
		const localSpy = vi.spyOn(upload, "uploadLocalFile");

		const out = await resolveMediaFields(
			{ image: "https://x.com/a.png" },
			[imageField],
			CTX,
		);
		expect(out).toEqual({ image: "https://x.com/a.png" });
		expect(dataSpy).not.toHaveBeenCalled();
		expect(localSpy).not.toHaveBeenCalled();
	});

	it("resolves arrays of media values", async () => {
		const spy = vi
			.spyOn(upload, "uploadDataUrl")
			.mockResolvedValueOnce("https://cdn/1.png")
			.mockResolvedValueOnce("https://cdn/2.png");

		const out = await resolveMediaFields(
			{
				images: ["data:image/png;base64,AAA=", "data:image/png;base64,BBB="],
			},
			[imagesField],
			CTX,
		);
		expect(out).toEqual({
			images: ["https://cdn/1.png", "https://cdn/2.png"],
		});
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it("normalizes a non-array value into a single-element array for array fields", async () => {
		vi.spyOn(upload, "uploadDataUrl").mockResolvedValue(PUBLIC_URL);

		const out = await resolveMediaFields(
			{ images: "data:image/png;base64,SGVsbG8=" },
			[imagesField],
			CTX,
		);
		expect(out).toEqual({ images: [PUBLIC_URL] });
	});

	it("skips fields whose value is undefined", async () => {
		const spy = vi.spyOn(upload, "uploadDataUrl");
		const out = await resolveMediaFields({}, [imageField], CTX);
		expect(out).toEqual({});
		expect(spy).not.toHaveBeenCalled();
	});

	it("does not mutate the input object", async () => {
		vi.spyOn(upload, "uploadDataUrl").mockResolvedValue(PUBLIC_URL);
		const input = { image: "data:image/png;base64,SGVsbG8=" };
		const out = await resolveMediaFields(input, [imageField], CTX);
		expect(input.image).toBe("data:image/png;base64,SGVsbG8=");
		expect(out.image).toBe(PUBLIC_URL);
	});
});
