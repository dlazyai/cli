const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const skillsDir = path.join(__dirname, "skills");
const newOnly = process.argv.includes("--new-only");
const dirs = fs
	.readdirSync(skillsDir)
	.filter((d: any) => fs.statSync(path.join(skillsDir, d)).isDirectory());

function skillExists(name: string) {
	try {
		const output = execSync(`clawhub inspect "${name}" --json`, {
			encoding: "utf8",
		});
		if (output.includes("Skill not found")) return false;
		if (output.trim().startsWith("{")) return true;
		throw new Error(`Unexpected inspect output for ${name}`);
	} catch (error: any) {
		const output = `${error?.stdout || ""}${error?.stderr || ""}`;
		if (output.includes("Skill not found")) return false;
		throw error;
	}
}

for (const dir of dirs) {
	const skillPath = path.join(skillsDir, dir);
	const mdPath = path.join(skillPath, "SKILL.md");
	if (!fs.existsSync(mdPath)) continue;

	const content = fs.readFileSync(mdPath, "utf8");
	const nameMatch = content.match(/name: ([^\n]+)/);
	const versionMatch = content.match(/version: (\d+)\.(\d+)\.(\d+)/);
	if (!nameMatch) {
		console.log(`No name found in ${dir}`);
		continue;
	}
	if (!versionMatch) {
		console.log(`No version found in ${dir}`);
		continue;
	}

	const skillName = nameMatch[1].trim();
	const newVersion = `${versionMatch[1]}.${versionMatch[2]}.${parseInt(versionMatch[3], 10)}`;

	if (newOnly && skillExists(skillName)) {
		console.log(`Skipping existing skill ${skillName}`);
		continue;
	}

	// update SKILL.md, SKILL-cn.md, SKILL-en.md
	for (const file of ["SKILL.md", "SKILL-cn.md", "SKILL-en.md"]) {
		const fp = path.join(skillPath, file);
		if (fs.existsSync(fp)) {
			let fc = fs.readFileSync(fp, "utf8");
			fc = fc.replace(/version: \d+\.\d+\.\d+/, `version: ${newVersion}`);
			fs.writeFileSync(fp, fc, "utf8");
		}
	}

	console.log(`Publishing ${dir} @ ${newVersion}...`);
	try {
		const output = execSync(
			`clawhub publish "${skillPath}" --version ${newVersion}`,
			{
				encoding: "utf8",
			},
		);
		if (output) {
			process.stdout.write(output);
		}
	} catch (error: any) {
		const output = `${error?.stdout || ""}${error?.stderr || ""}`;
		if (newOnly && output.includes("Version already exists")) {
			console.log(`Skipping existing skill ${skillName}`);
			continue;
		}
		if (output) {
			process.stderr.write(output);
		}
		console.error(`Failed to publish ${dir}`);
	}

	// sleep 5s to prevent rate limiting
	execSync('node -e "setTimeout(()=>{}, 5000)"');
}
console.log("All skills processed!");
