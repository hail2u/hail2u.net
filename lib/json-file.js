import fs from "fs/promises";
import { outputFile } from "./output-file.js";

const outputJSONFile = async (file, obj) => {
	const formatted = JSON.stringify(obj, null, "\t");
	await outputFile(file, `${formatted}
`);
};

const readJSONFile = async (file) => {
	const json = await fs.readFile(file, "utf8");
	return JSON.parse(json);
};

export { outputJSONFile, readJSONFile };
