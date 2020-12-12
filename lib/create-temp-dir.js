import fs from "fs/promises";
import os from "os";
import path from "path";
import { readJSONFile } from "./json-file.js";

const createTempDir = async () => {
	const [tmpdir, pkg] = await Promise.all([
		fs.realpath(os.tmpdir()),
		readJSONFile("./package.json"),
	]);
	return fs.mkdtemp(path.join(tmpdir, path.sep, `${pkg.name}-`));
};

export { createTempDir };
