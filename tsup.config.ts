import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		sdk: "src/sdk/index.ts",
	},
	format: ["cjs"],
	tsconfig: "tsconfig.json",
	dts: {
		entry: { sdk: "src/sdk/index.ts" },
		compilerOptions: {
			ignoreDeprecations: "6.0",
		},
	},
	clean: true,
	target: "node18",
	splitting: false,
	sourcemap: false,
});
