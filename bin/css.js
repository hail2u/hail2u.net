import config from "../.config.js";
import fs from "fs/promises";
import { outputFile } from "../lib/output-file.js";
import pcImport from "postcss-import";
import postcss from "postcss";
import { readJSONFile } from "../lib/json-file.js";

const removeComment = (comment) => {
	if (comment.text.startsWith("!")) {
		return;
	}

	comment.remove();
};

const removeComments = (root) => {
	root.walkComments(removeComment);
};

const compile = async (file) => {
	const css = await fs.readFile(file, "utf8");
	return postcss().use(pcImport).use(removeComments).process(css, {
		from: file,
	});
};

const build = async (version, file) => {
	const dest = file.dest.replace(/\{\{version\}\}/gu, version);
	const compiled = await compile(file.src);
	await outputFile(dest, compiled.css);
};

const main = async () => {
	const file = new URL("../package.json", import.meta.url);
	const pkg = await readJSONFile(file);
	await Promise.all(config.files.css.map(build.bind(null, pkg.version)));
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
