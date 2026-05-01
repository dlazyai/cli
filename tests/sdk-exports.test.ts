import { describe, expect, it } from "vitest";
import { Handle } from "../src/sdk/handle";
import * as sdk from "../src/sdk/index";
import * as namedTools from "../src/sdk/named-tools";

describe("sdk named exports", () => {
	it("re-exports every static helper from named-tools", () => {
		const namedExports = sdk as Record<string, unknown>;
		const expectedExports = Object.keys(namedTools).sort();

		for (const exportName of expectedExports) {
			expect(namedExports).toHaveProperty(exportName);
			expect(typeof namedExports[exportName]).toBe("function");
		}
	});

	it("builds handles using the normalized export name", () => {
		const handle = sdk.gpt_image_2({ prompt: "test prompt" });

		expect(handle).toBeInstanceOf(Handle);
		expect(handle.toolName).toBe("gpt-image-2");
		expect(handle.input).toEqual({ prompt: "test prompt" });
	});
});
