import config from "../.config.js";
import fs from "fs/promises";
import { outputFile } from "../lib/output-file.js";
import { readJSONFile } from "../lib/json-file.js";

const main = async () => {
	const html = await fs.readFile(config.paths.src.styleGuide, "utf8");
	const file = new URL("../package.json", import.meta.url);
	const pkg = await readJSONFile(file);
	const optimized = html
		.replace(/\b(href|src)="(\.\.|https:\/\/hail2u\.net)(\/.*?)"/gu, '$1="$3"')
		.replace(/<!-- version -->/gu, ` v${pkg.version}`);
	await outputFile(config.paths.dest.styleGuide, optimized);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
