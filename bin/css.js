import CleanCSS from "clean-css";
import config from "./config.js";
import fs from "fs/promises";
import getVersion from "../lib/get-version.js";

const minifier = new CleanCSS({
	format: "beautify",
	level: 0,
	returnPromise: true
});

const buildCSS = async (file) => {
	const [version, minified] = await Promise.all([
		getVersion(),
		minifier.minify([file.src])
	]);
	const dest = file.dest.replace(/{{version}}/g, version);
	await fs.writeFile(dest, minified.styles);
};

Promise.all(config.files.css.map(buildCSS)).catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
