import config from "../config.js";
import fs from "node:fs/promises";
import { globAsync } from "../lib/glob-async.js";
import { outputFile } from "../lib/output-file.js";
import path from "node:path";

const toFilesFormat = (src) => {
	const relpath = src.replace(config.src.assets, config.dest.root);
	const dirname = path.dirname(relpath);
	const basename = path.basename(src, path.extname(src));
	return {
		dest: path.join(dirname, `${basename}.${config.version}.css`),
		src
	};
};

const gatherFiles = async () => {
	const files = await globAsync(`${config.src.assets}css/**/*.css`, { ignore: "**/_*" });
	return Promise.all(files.map(toFilesFormat));
};

const processComment = (line) => {
	const trimmed = line.trim();

	if (!trimmed.startsWith("/*") || !trimmed.endsWith("*/")) {
		return line;
	}

	if (trimmed.startsWith("/*!") && trimmed.endsWith("*/")) {
		return line;
	}

	if (trimmed.startsWith("/*-") && trimmed.endsWith("*/")) {
		return line
			.slice(3, -2)
			.trim();
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
	const lines = css.split("\n");
	const processed = await Promise.all(lines.map(processComment));
	return processed.join("\n");
};

const build = async (file) => {
	const css = await fs.readFile(file.src, "utf8");
	const lines = css.split("\n");
	const inlined = await Promise.all(lines.map(inline.bind(null, file.src)));
	const processed = await Promise.all(inlined.map(processComment));
	await outputFile(file.dest, processed.join("\n"));
};

const main = async () => {
	const files = await gatherFiles();
	await Promise.all(files.map(build));
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
