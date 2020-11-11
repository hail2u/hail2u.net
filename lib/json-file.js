import fs from "fs/promises";

const readJSONFile = async (file) => {
	const json = await fs.readFile(file, "utf8");
	return JSON.parse(json);
};

const writeJSONFile = async (file, obj) => {
	const formatted = `${JSON.stringify(obj, null, "\t")}
`;
	await fs.writeFile(file, formatted);
};

export {
	readJSONFile,
	writeJSONFile
};
