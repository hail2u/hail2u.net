import { Ico, IcoImage } from "@fiahfy/ico";
import config from "../.config.js";
import { outputFile } from "../lib/output-file.js";
import sharp from "sharp";

const generatePNG = async (favicon, file) => {
	const metadata = await sharp(file.src).metadata();
	const icon = sharp(file.src, {
		density: (file.width * metadata.density) / metadata.width,
	});
	icon.resize(file.width);

	if (!file.dest) {
		const png = await icon.png().toBuffer();
		favicon.append(IcoImage.fromPNG(png));
		return;
	}

	await icon.toFile(file.dest);
};

const main = async () => {
	const favicon = new Ico();
	await Promise.all(config.files.icon.map(generatePNG.bind(null, favicon)));
	await outputFile(config.paths.dest.favicon, favicon.data);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
