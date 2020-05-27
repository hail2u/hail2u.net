import fs from "fs/promises";
import {
	outputFile
} from "./output-file.js";

const outputJSONFile = (file, obj) => outputFile(file, `${JSON.stringify(obj, null, "\t")}
`);

const readJSONFile = async (file) => {
	const json = await fs.readFile(file, "utf8");
	return JSON.parse(json);
};

export {
	outputJSONFile,
	readJSONFile
};
