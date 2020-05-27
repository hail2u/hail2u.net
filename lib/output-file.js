import fs from "fs/promises";
import path from "path";

const outputFile = async (file, data) => {
	await fs.mkdir(path.dirname(file), {
		recursive: true
	});
	await fs.writeFile(file, data);
};

export {
	outputFile
};
