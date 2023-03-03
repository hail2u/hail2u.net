import { readJSONFile } from "./lib/json-file.js";

const pkg = new URL("./package.json", import.meta.url);
const {
	name,
	version
} = await readJSONFile(pkg);

export default {
	dest: {
		article: "dist/blog/",
		root: "dist/"
	},
	name,
	src: {
		data: "data/",
		draft: "drafts.html",
		metadata: "metadata/",
		templates: "templates/"
	},
	version
};
