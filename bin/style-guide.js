import config from "../.config.js";
import fs from "fs/promises";
import { outputFile } from "../lib/output-file.js";

const toAbsolutePath = (m, attr, prefix, path) => {
	if (path === "/style-guide/") {
		return m;
	}

	return `${attr}="${path}"`;
};

const main = async () => {
	const html = await fs.readFile(config.paths.src.styleGuide, "utf8");
	const optimized = html.replace(
		/\b(href|src)="(\.\.|https:\/\/hail2u\.net)(\/.*?)"/gu,
		toAbsolutePath
	);
	await outputFile(config.paths.dest.styleGuide, optimized);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
