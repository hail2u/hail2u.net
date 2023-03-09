import pkg from "./package.json" assert { type: "json" };

export default {
	dir: {
    data: "data/",
		dest: "dist/",
    metadata: "metadata/",
    template: "templates/"
	},
	file: {
    draft: "drafts.html",
    template: {
      test: "templates/blog/_test.mustache"
    }
	},
	name: pkg.name,
	version: pkg.version
};
