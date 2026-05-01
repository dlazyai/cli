const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const skillsDir = path.join(__dirname, "skills");
const dirs = fs
	.readdirSync(skillsDir)
	.filter((d: any) => fs.statSync(path.join(skillsDir, d)).isDirectory());

for (const dir of dirs) {
	const skillPath = path.join(skillsDir, dir);
	const mdPath = path.join(skillPath, "SKILL.md");
	if (!fs.existsSync(mdPath)) continue;

	const content = fs.readFileSync(mdPath, "utf8");
	const versionMatch = content.match(/version: (\d+)\.(\d+)\.(\d+)/);
	if (!versionMatch) {
		console.log(`No version found in ${dir}`);
		continue;
	}

	const newVersion = `${versionMatch[1]}.${versionMatch[2]}.${parseInt(versionMatch[3], 10)}`;

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
		execSync(`clawhub publish "${skillPath}" --version ${newVersion}`, {
			stdio: "inherit",
		});
	} catch (_e) {
		console.error(`Failed to publish ${dir}`);
	}

	// sleep 5s to prevent rate limiting
	execSync('node -e "setTimeout(()=>{}, 5000)"');
}
console.log("All skills processed!");
