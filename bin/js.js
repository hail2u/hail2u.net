import babel from "@babel/core";
import config from "./config.js";
import { getVersion } from "../lib/get-version.js";
import { outputFile } from "../lib/output-file.js";

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
	const version = await getVersion();
	await Promise.all(config.files.js.map(buildJS.bind(null, version)));
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
