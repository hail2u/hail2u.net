import config from "../.config.js";
import sharp from "sharp";

const generatePNG = async (file) => {
	const metadata = await sharp(file.src).metadata();
	const img = sharp(file.src, {
		density: (file.width * metadata.density) / metadata.width
	});
	img.resize(file.width);
	await img.toFile(file.dest);
};

const main = async () => {
	await Promise.all(config.files.img.map(generatePNG));
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
