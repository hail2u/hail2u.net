import config from "./config.js";
import fs from "fs/promises";
import ico from "@fiahfy/ico";
import path from "path";
import sharp from "sharp";

const { Ico, IcoImage } = ico;

const generatePNG = async (file) => {
	await sharp(file.src)
		.resize(file.width)
		.toFile(file.dest);
	return file.dest;
};

const isFaviconSource = (filepath) => path.basename(filepath).startsWith("favicon-");

const appendIcon = async (icon, src) => {
	const png = await fs.readFile(src, {
		encoding: null
	});
	icon.append(IcoImage.fromPNG(png));
};

const toIco = async (srcs) => {
	const icon = new Ico();
	await Promise.all(srcs.map(appendIcon.bind(null, icon)));
	return icon.data;
};

const main = async () => {
	const pngs = await Promise.all(config.files.icon.map(generatePNG));
	const srcs = await Promise.all(pngs.filter(isFaviconSource));
	const favicon = await toIco(srcs);
	await fs.writeFile(config.dest.favicon, favicon);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
