import babel from "@babel/core";
import config from "../.config.js";
import { outputFile } from "../lib/output-file.js";
import { readJSONFile } from "../lib/json-file.js";

const build = async (version, file) => {
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
	const file = new URL("../package.json", import.meta.url);
	const { version } = await readJSONFile(file);
	await Promise.all(config.files.js.map(build.bind(null, version)));
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
