import config from "./config.js";
import fs from "fs/promises";
import {
	getVersion
} from "../lib/get-version.js";
import {
	outputFile
} from "../lib/output-file.js";
import pcImport from "postcss-import";
import postcss from "postcss";
import {
	removeComments
} from "../lib/postcss/remove-comments.js";
import stylelint from "stylelint";
import {
	wrapWithSupports
} from "../lib/postcss/wrap-with-supports.js";

const process = async (file) => {
	const css = await fs.readFile(file, "utf8");
	return postcss()
		.use(pcImport)
		.use(removeComments)
		.use(stylelint({
			"fix": true
		}))
		.use(wrapWithSupports)
		.process(css, {
			"from": file
		});
};

const buildCSS = async (file) => {
	const [
		version,
		processed
	] = await Promise.all([
		getVersion(),
		process(file.src)
	]);
	const dest = file.dest.replace(/{{version}}/g, version);
	await outputFile(dest, processed.css);
};

Promise.all(config.files.css.map(buildCSS)).catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
