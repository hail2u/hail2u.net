import config from "./config.js";
import fs from "fs/promises";
import path from "path";

const main = async () => {
	const html = await fs.readFile(config.src.styleGuide, "utf8");
	const optimized = html.replace(
		/\b(href|src)="(\.\.|https:\/\/hail2u\.net)(\/.*?)"/g,
		"$1=\"$3\""
	);
	await fs.mkdir(path.dirname(config.dest.styleGuide), {
		recursive: true
	});
	await fs.writeFile(config.dest.styleGuide, optimized);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
