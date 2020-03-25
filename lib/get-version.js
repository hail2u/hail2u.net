import { readJSONFile } from "./json-file.js";

export default async () => {
	const pkg = await readJSONFile("./package.json");
	return pkg.version;
};
