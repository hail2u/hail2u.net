import config from "../config.js";
import path from "node:path";

const guessPath = (template, dir, filename) => {
	const filepath = template.replace(config.src.templates, dir);
	const dirname = path.dirname(filepath);

	if (!filename.startsWith(".")) {
		return path.join(dirname, filename);
	}

	const basename = path.basename(template, path.extname(template));
	return path.join(dirname, `${basename}${filename}`);
};

export { guessPath };
