import config from "../.config.js";
import fs from "fs/promises";
import { outputFile } from "../lib/output-file.js";
import path from "path";
import { readJSONFile } from "../lib/json-file.js";

const removeCommentLine = (line) => {
	const trimmed = line.trim();

	if (!trimmed.startsWith("/*") || !trimmed.endsWith("*/")) {
		return line;
	}

	if (trimmed.startsWith("/*!")) {
		return line;
	}

	return "";
};

const inline = async (src, line) => {
	if (!line.startsWith("@import")) {
		return line;
	}

	const root = path.dirname(src);
	const openQuote = line.indexOf('"');
	const closeQuote = line.lastIndexOf('"');
	const filename = line.substring(openQuote + 1, closeQuote);
	const file = path.resolve(root, filename);
	const css = await fs.readFile(file, "utf8");
	return css.split("\n").map(removeCommentLine).join("\n");
};

const build = async (version, {
	dest,
	src
}) => {
	const versioned = dest.replace(/\{\{version\}\}/gu, version);
	const css = await fs.readFile(src, "utf8");
	const lines = css.split("\n");
	const inlined = await Promise.all(lines.map(inline.bind(null, src)));
	const removed = await Promise.all(inlined.map(removeCommentLine));
	await outputFile(versioned, removed.join("\n"));
};

const main = async () => {
	const file = new URL("../package.json", import.meta.url);
	const { version } = await readJSONFile(file);
	await Promise.all(config.files.css.map(build.bind(null, version)));
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
