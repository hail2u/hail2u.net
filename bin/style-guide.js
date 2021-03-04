import config from "../.config.js";
import fs from "fs/promises";
import { outputFile } from "../lib/output-file.js";
import { readJSONFile } from "../lib/json-file.js";

const toAbsolutePath = (m, attr, prefix, path) => {
	if (path === "/style-guide/") {
		return m;
	}

	return `${attr}="${path}"`;
};

const main = async () => {
	const html = await fs.readFile(config.paths.src.styleGuide, "utf8");
	const { domain, scheme } = await readJSONFile(config.paths.metadata.root);
	const urlRe = new RegExp(
		`\\b(href|src)="(\\.\\.|${scheme}://${domain})(/.*?)"`,
		"gu"
	);
	const optimized = html.replace(urlRe, toAbsolutePath);
	await outputFile(config.paths.dest.styleGuide, optimized);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
