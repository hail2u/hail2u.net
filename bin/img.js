import config from "./config.js";
import fs from "fs/promises";
import ico from "@fiahfy/ico";
import path from "path";
import sharp from "sharp";

const { Ico, IcoImage } = ico;

const generatePNG = async (favicon, file) => {
	const metadata = await sharp(file.src).metadata();
	const img = await sharp(file.src, {
		density: (file.width * metadata.density) / metadata.width,
	});
	await img.resize(file.width);

	if (!file.dest) {
		const png = await img.png().toBuffer();
		favicon.append(IcoImage.fromPNG(png));
		return;
	}

	img.toFile(file.dest);
};

const main = async () => {
	const favicon = new Ico();
	await Promise.all(config.files.icon.map(generatePNG.bind(null, favicon)));
	await fs.mkdir(path.dirname(config.dest.favicon), {
		recursive: true,
	});
	await fs.writeFile(config.dest.favicon, favicon.data);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
