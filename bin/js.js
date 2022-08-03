import babel from "@babel/core";
import config from "../config.js";
import { globAsync } from "../lib/glob-async.js";
import { outputFile } from "../lib/output-file.js";
import path from "node:path";

const toFilesFormat = (src) => {
	const relpath = src.replace(config.src.assets, config.dest.root);
	const dirname = path.dirname(relpath);
	const basename = path.basename(src, path.extname(src));
	return {
		dest: path.join(dirname, `${basename}.${config.version}.js`),
		src
	};
};

const gatherFiles = async () => {
	const files = await globAsync(`${config.src.assets}js/**/*.js`, { ignore: "**/_*" });
	return Promise.all(files.map(toFilesFormat));
};

const build = async (file) => {
	const compiled = await babel.transformFileAsync(file.src, {
		presets: [
			[
				"@babel/preset-env",
				{
					targets: "defaults",
				}
			]
		]
	});
	const wrapped = `(function () {
${compiled.code.trim()}
})();`;
	await outputFile(file.dest, wrapped);
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
