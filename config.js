import pkg from "./package.json" assert { type: "json" };

export default {
	dest: {
		article: "dist/blog/",
		root: "dist/"
	},
	name: pkg.name,
	src: {
		data: "data/",
		draft: "drafts.html",
		metadata: "metadata/",
		templates: "templates/"
	},
	version: pkg.version
};
