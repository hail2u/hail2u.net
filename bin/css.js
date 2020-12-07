import config from "./config.js";
import fs from "fs/promises";
import { getVersion } from "../lib/get-version.js";
import { outputFile } from "../lib/output-file.js";
import pcImport from "postcss-import";
import postcss from "postcss";

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
		.use(wrapWithSupports)
		.process(css, {
			from: file,
		});
};

const buildCSS = async (version, file) => {
	const dest = file.dest.replace(/\{\{version\}\}/gu, version);
	const processed = await process(file.src);
	await outputFile(dest, processed.css);
};

const main = async () => {
	const version = await getVersion();
	await Promise.all(config.files.css.map(buildCSS.bind(null, version)));
	const html = await fs.readFile(config.src.styleGuide, "utf8");
	const optimized = html
		.replace(/\b(href|src)="(\.\.|https:\/\/hail2u\.net)(\/.*?)"/gu, '$1="$3"')
		.replace(/<!-- version -->/gu, ` v${version}`);
	await outputFile(config.dest.styleGuide, optimized);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
