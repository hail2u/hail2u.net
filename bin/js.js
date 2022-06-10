import babel from "@babel/core";
import config from "../.config.js";
import { globAsync } from "../lib/glob-async.js";
import { outputFile } from "../lib/output-file.js";
import path from "node:path";
import { readJSONFile } from "../lib/json-file.js";

const toFilesFormat = (version, src) => {
	const relpath = src.replace(config.src.assets, config.dest.root);
	const dirname = path.dirname(relpath);
	const basename = path.basename(src, path.extname(src));
	return {
		dest: path.join(dirname, `${basename}.${version}.js`),
		src
	};
};

const gatherFiles = async () => {
	const pkg = new URL("../package.json", import.meta.url);
	const [
		files,
		{ version }
	] = await Promise.all([
		globAsync(`${config.src.assets}js/**/*.js`, { ignore: "**/_*" }),
		readJSONFile(pkg)
	]);
	return Promise.all(files.map(toFilesFormat.bind(null, version)));
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
