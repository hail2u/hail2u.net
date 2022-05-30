import {
	Ico,
	IcoImage
} from "@fiahfy/ico";
import config from "../.config.js";
import { outputFile } from "../lib/output-file.js";
import sharp from "sharp";

const generatePNG = async (file) => {
	const metadata = await sharp(file.src).metadata();
	const density = (file.width * metadata.density) / metadata.width;
	const img = sharp(file.src, { density });
	img.resize(file.width);
	return img;
};

const appendToFavicon = async (favicon, img) => {
	const png = await img.png().toBuffer();
	favicon.append(IcoImage.fromPNG(png));
};

const build = async (file) => {
	if (file.width) {
		const img = await generatePNG(file);
		await img.toFile(file.dest);
		return;
	}

	const imgs = await Promise.all(
		[
			{
				...file,
				width: 16
			},
			{
				...file,
				width: 24
			},
			{
				...file,
				width: 32
			},
			{
				...file,
				width: 48
			},
			{
				...file,
				width: 128
			},
		].map(generatePNG)
	);
	const favicon = new Ico();
	await Promise.all(imgs.map(appendToFavicon.bind(null, favicon)));
	await outputFile(file.dest, favicon.data);
};

Promise.all(config.img.map(build)).catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
