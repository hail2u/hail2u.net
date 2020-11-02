import config from "./config.js";
import fs from "fs/promises";
import {
	getVersion
} from "../lib/get-version.js";
import path from "path";
import pcImport from "postcss-import";
import postcss from "postcss";
import stylelint from "stylelint";

const removeComment = (comment) => {
	if (comment.text.startsWith("!")) {
		return;
	}

	comment.remove();
};

const removeComments = (root) => {
	root.walkComments(removeComment);
};

const addNode = (supports, node) => {
	supports.first.append(node);
};

const wrapWithSupports = (root) => {
	const supports = postcss.parse("@supports (--custom-property: true) {}");
	root.each(addNode.bind(null, supports));
	root.append(supports);
};

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
	await fs.mkdir(path.dirname(dest), {
		recursive: true
	});
	await fs.writeFile(dest, processed.css);
};

Promise.all(config.files.css.map(buildCSS)).catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
