import { readJSONFile } from "./lib/json-file.js";

const pkg = new URL("./package.json", import.meta.url);
const {
	name,
	version
} = await readJSONFile(pkg);

export default {
	dest: {
		article: "dist/blog/",
		root: "dist/",
		sitemap: "dist/sitemap.xml",
		styleGuide: "dist/style-guide/index.html"
	},
	name,
	src: {
		assets: "assets/",
		data: "data/",
		draft: "drafts.html",
		icon: "assets/img/icon.svg",
		metadata: "metadata/",
		styleGuide: "assets/css/test.html",
		templates: "templates/"
	},
	version
};
