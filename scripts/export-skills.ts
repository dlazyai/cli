/**
 * 扫描 skills/ 下每个子目录的 SKILL.md，提取 frontmatter 中的 name 字段，
 * 将所有 name 写入 skills/skills.txt（一行一个，名称中的 "." 会替换成 "-"）。
 *
 * 执行命令:
 *   pnpm run skills:export
 *   或: npx tsx scripts/export-skills.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";

const SKILLS_DIR = path.join(__dirname, "../skills");
const OUTPUT_FILE = path.join(SKILLS_DIR, "skills.txt");

function extractName(skillMdPath: string): string | null {
	const content = fs.readFileSync(skillMdPath, "utf8");
	const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
	const frontmatter = match?.[1];
	if (!frontmatter) return null;
	const rawName = frontmatter.match(/^name:\s*(.+)$/m)?.[1];
	if (!rawName) return null;
	return rawName.trim().replace(/^["']|["']$/g, "");
}

function main(): void {
	const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
	const names: string[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const skillMd = path.join(SKILLS_DIR, entry.name, "SKILL.md");
		if (!fs.existsSync(skillMd)) continue;
		const name = extractName(skillMd);
		if (!name) {
			console.warn(`No name found in ${skillMd}`);
			continue;
		}
		names.push(name.replace(/\./g, "-"));
	}

	names.sort();
	fs.writeFileSync(OUTPUT_FILE, `${names.join("\n")}\n`);
	console.log(`Wrote ${names.length} skills to ${OUTPUT_FILE}`);
}

main();
