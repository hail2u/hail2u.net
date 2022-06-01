import config from "../.config.js";
import fs from "node:fs/promises";
import { outputFile } from "../lib/output-file.js";

const toAbsolutePath = (m, attr, path) => {
	if (path === "/style-guide/") {
		return m;
	}

	return `${attr}="${path}"`;
};

const main = async () => {
	const html = await fs.readFile(config.src.styleGuide, "utf8");
	const urlRe = new RegExp(
		`\\b(href|src)="(?:\\.\\./\\.\\./(?:assets|static)|${config.metadata.scheme}://${config.metadata.domain})(/.*?)"`,
		"gu"
	);
	const optimized = html.replace(urlRe, toAbsolutePath);
	await outputFile(config.dest.styleGuide, optimized);
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
