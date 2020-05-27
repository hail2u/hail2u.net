import config from "./config.js";
import ico from "@fiahfy/ico";
import {
	outputFile
} from "../lib/output-file.js";
import sharp from "sharp";

const {
	Ico,
	IcoImage
} = ico;

const generatePNG = async (favicon, file) => {
	const img = await sharp(file.src)
		.resize(file.width);

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
	await outputFile(config.dest.favicon, favicon.data);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
