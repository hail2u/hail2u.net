import config from "./config.js";
import fs from "fs/promises";
import {
	outputFile
} from "../lib/output-file.js";

const main = async () => {
	const reURLAttr = /\b(href|src)="(\.\.|https:\/\/hail2u\.net)(\/.*?)"/g;
	const html = await fs.readFile(config.src.styleGuide, "utf8");
	await outputFile(config.dest.styleGuide, html.replace(reURLAttr, "$1=\"$3\""));
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
