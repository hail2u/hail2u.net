import config from "../config.js";
import ico from "@fiahfy/ico";
import { outputFile } from "../lib/output-file.js";
import path from "node:path";
import sharp from "sharp";

const generatePNG = async (src, width) => {
	const metadata = await sharp(src).metadata();
	const density = (width * metadata.density) / metadata.width;
	const img = sharp(src, { density });
	img.resize(width);
	return img;
};

const appendTo = async (favicon, img) => {
	const png = await img.png().toBuffer();
	favicon.append(ico.IcoImage.fromPNG(png));
};

const main = async () => {
	const [
		favicon,
		touchIcon,
		...icons
	] = await Promise.all([
		new ico.Ico(),
		generatePNG(config.src.icon, 180),
		generatePNG(config.src.icon, 16),
		generatePNG(config.src.icon, 24),
		generatePNG(config.src.icon, 32),
		generatePNG(config.src.icon, 48),
		generatePNG(config.src.icon, 128)
	]);
	await Promise.all(icons.map(appendTo.bind(null, favicon)));
	await Promise.all([
		touchIcon.toFile(path.join(config.dest.root, "apple-touch-icon.png")),
		outputFile(path.join(config.dest.root, "favicon.ico"), favicon.data)
	]);
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
