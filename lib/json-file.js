import fs from "fs/promises";

const writeJSONFile = async (file, obj) => {
	const formatted = `${JSON.stringify(obj, null, "\t")}
`;
	await fs.writeFile(file, formatted);
};

const readJSONFile = async (file) => {
	const json = await fs.readFile(file, "utf8");
	return JSON.parse(json);
};

export {
	writeJSONFile,
	readJSONFile
};
