import config from "./config.js";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import toIco from "to-ico";

const generatePNG = async (file) => {
	await sharp(file.src)
		.resize(file.width)
		.toFile(file.dest);
	return file.dest;
};

const isFaviconSource = (filepath) => path.basename(filepath).startsWith("favicon-");

const readPNG = (png) => fs.readFile(png, {
	encoding: null
});

const main = async () => {
	const pngs = await Promise.all(config.files.icon.map(generatePNG));
	const srcs = await Promise.all(pngs.filter(isFaviconSource).map(readPNG));
	const favicon = await toIco(srcs);
	await fs.writeFile(config.dest.favicon, favicon);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
