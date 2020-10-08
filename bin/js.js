import babel from "@babel/core";
import config from "./config.js";
import fs from "fs/promises";
import {
	getVersion
} from "../lib/get-version.js";
import path from "path";

const buildJS = async (file) => {
	const [
		version,
		compiled
	] = await Promise.all([
		getVersion(),
		babel.transformFileAsync(file.src, {
			"presets": [
				[
					"@babel/preset-env",
					{
						"targets": "defaults"
					}
				]
			]
		})
	]);
	const dest = file.dest.replace(/{{version}}/g, version);
	const wrapped = `(function () {
${compiled.code.trim()}
})();`;
	await fs.mkdir(path.dirname(dest), {
		recursive: true
	});
	await fs.writeFile(dest, wrapped);
};

Promise.all(config.files.js.map(buildJS)).catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
