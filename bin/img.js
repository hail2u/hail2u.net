import config from "../.config.js";
import ico from "@fiahfy/ico";
import { outputFile } from "../lib/output-file.js";
import sharp from "sharp";

const { Ico, IcoImage } = ico;

const generatePNG = async (favicon, file) => {
	const metadata = await sharp(file.src).metadata();
	const img = sharp(file.src, {
		density: (file.width * metadata.density) / metadata.width,
	});
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
	const generatePNGB = generatePNG.bind(null, favicon);
	await Promise.all(config.files.icon.map(generatePNGB));
	await outputFile(config.paths.dest.favicon, favicon.data);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
