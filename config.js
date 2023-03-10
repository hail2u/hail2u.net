import pkg from "./package.json" assert { type: "json" };

export default {
	dir: {
    assets: "assets",
    data: "data/",
		dest: "dist/",
    metadata: "metadata/",
    template: "templates/"
	},
	file: {
    draft: "drafts.html",
    icon: "static/favicon.svg"
  },
  name: pkg.name,
  version: pkg.version
};
