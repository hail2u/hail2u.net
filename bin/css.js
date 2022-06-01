import config from "../.config.js";
import fs from "node:fs/promises";
import { globAsync } from "../lib/glob-async.js";
import { outputFile } from "../lib/output-file.js";
import path from "node:path";
import { readJSONFile } from "../lib/json-file.js";

const toFilesFormat = (src) => {
	const relpath = src.replace(config.src.assets, config.dest.root);
	const dirname = path.dirname(relpath);
	const basename = path.basename(src, path.extname(src));
	return {
		dest: path.join(dirname, `${basename}.css`),
		src
	};
};

const gatherFiles = async () => {
	const css = await globAsync(`${config.src.assets}**/*.css`, {
		ignore: "**/_*.css"
	});
	return Promise.all(css.map(toFilesFormat));
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
	return css
		.split("\n")
		.map(processComment)
		.join("\n");
};

const build = async (version, {
	dest,
	src
}) => {
	const versioned = dest.replace(".css", `.${version}.css`);
	const css = await fs.readFile(src, "utf8");
	const lines = css.split("\n");
	const inlined = await Promise.all(lines.map(inline.bind(null, src)));
	const processed = inlined
		.map(processComment)
		.join("\n");
	await outputFile(versioned, processed);
};

const main = async () => {
	const pkg = new URL("../package.json", import.meta.url);
	const [
		files,
		{ version }
	] = await Promise.all([
		gatherFiles(),
		readJSONFile(pkg)
	]);
	await Promise.all(files.map(build.bind(null, version)));
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
