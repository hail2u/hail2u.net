import pkg from "./package.json" assert { type: "json" };

export default {
	dir: {
    data: "data/",
		dest: "dist/",
    metadata: "metadata/",
    template: "templates/"
	},
	file: {
    draft: "drafts.html"
	},
	name: pkg.name,
	version: pkg.version
};
