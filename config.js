import fs from "node:fs/promises";

const file = new URL("./package.json", import.meta.url);
const json = await fs.readFile(file, "utf8");
const {
	name,
	version
} = await JSON.parse(json);

// import {
// 	name,
// 	version
// } from './package.json' assert { type: 'json' };

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
