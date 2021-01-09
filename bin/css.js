import config from "../.config.js";
import fs from "fs/promises";
import { outputFile } from "../lib/output-file.js";
import path from "path";
import { readJSONFile } from "../lib/json-file.js";

const inline = (from, line) => {
	if (!line.startsWith("@import")) {
		return line;
	}

	const [, url] = line.split('"');
	const abs = path.resolve(path.dirname(from), url);
	return fs.readFile(abs, "utf8");
};

const build = async (version, file) => {
	const dest = file.dest.replace(/\{\{version\}\}/gu, version);
	const css = await fs.readFile(file.src, "utf8");
	const lines = css.split("\n");
	const inlined = await Promise.all(lines.map(inline.bind(null, file.src)));
	await outputFile(dest, inlined.join("\n"));
};

const main = async () => {
	const file = new URL("../package.json", import.meta.url);
	const pkg = await readJSONFile(file);
	await Promise.all(config.files.css.map(build.bind(null, pkg.version)));
	const html = await fs.readFile(config.paths.src.styleGuide, "utf8");
	const optimized = html
		.replace(/\b(href|src)="(\.\.|https:\/\/hail2u\.net)(\/.*?)"/gu, '$1="$3"')
		.replace(/<!-- version -->/gu, ` v${pkg.version}`);
	await outputFile(config.paths.dest.styleGuide, optimized);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
