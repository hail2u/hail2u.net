import babel from "@babel/core";
import config from "./config.js";
import fs from "fs/promises";
import { getVersion } from "../lib/get-version.js";
import path from "path";

const buildJS = async (version, file) => {
	const dest = file.dest.replace(/\{\{version\}\}/gu, version);
	const [compiled] = await Promise.all([
		babel.transformFileAsync(file.src, {
			presets: [
				[
					"@babel/preset-env",
					{
						targets: "defaults",
					},
				],
			],
		}),
		fs.mkdir(path.dirname(dest), {
			recursive: true,
		}),
	]);
	const wrapped = `(function () {
${compiled.code.trim()}
})();`;
	await fs.writeFile(dest, wrapped);
};

const main = async () => {
	const version = await getVersion();
	await Promise.all(config.files.js.map(buildJS.bind(null, version)));
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
