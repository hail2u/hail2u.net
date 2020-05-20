import {
	readJSONFile
} from "./json-file.js";

const getVersion = async () => {
	const pkg = await readJSONFile("./package.json");
	return pkg.version;
};

export {
	getVersion
};
