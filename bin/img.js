import {
	Ico,
	IcoImage
} from "@fiahfy/ico";
import config from "../.config.js";
import { outputFile } from "../lib/output-file.js";
import sharp from "sharp";

const generatePNG = async (favicon, file) => {
	const metadata = await sharp(file.src).metadata();
	const density = (file.width * metadata.density) / metadata.width;
	const img = sharp(file.src, { density });
	img.resize(file.width);

	if (!file.dest) {
		const png = await img.png().toBuffer();
		favicon.append(IcoImage.fromPNG(png));
		return;
	}

	await img.toFile(file.dest);
};

const main = async () => {
	const favicon = new Ico();
	await Promise.all(config.files.img.map(generatePNG.bind(null, favicon)));
	await outputFile(config.dest.favicon, favicon.data);
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
