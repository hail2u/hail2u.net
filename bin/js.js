import babel from "@babel/core";
import config from "../.config.js";
import { outputFile } from "../lib/output-file.js";
import { readJSONFile } from "../lib/json-file.js";

const buildJS = async (version, file) => {
	const dest = file.dest.replace(/\{\{version\}\}/gu, version);
	const compiled = await babel.transformFileAsync(file.src, {
		presets: [
			[
				"@babel/preset-env",
				{
					targets: "defaults",
				},
			],
		],
	});
	const wrapped = `(function () {
${compiled.code.trim()}
})();`;
	await outputFile(dest, wrapped);
};

const main = async () => {
	const json = new URL("../package.json", import.meta.url);
	const pkg = await readJSONFile(json);
	await Promise.all(config.files.js.map(buildJS.bind(null, pkg.version)));
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
