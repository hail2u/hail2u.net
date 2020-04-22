import config from "./index.js";
import fs from "fs/promises";

const main = async () => {
	const html = await fs.readFile(config.src.styleGuide, "utf8");
	await fs.writeFile(config.dest.styleGuide, html.replace(/\b(href|src)="(\.\.|https:\/\/hail2u\.net)(\/.*?)"/g, '$1="$3"'));
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
