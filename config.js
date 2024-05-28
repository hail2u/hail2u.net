/* ESLint v9 does not support `import .. from .. with`
 * import pkg from "./package.json" with { type: "json" };
 */
import fs from "node:fs/promises";

const file = new URL("./package.json", import.meta.url);
const json = await fs.readFile(file, "utf8");
const pkg = await JSON.parse(json);

export default {
  dir: {
    assets: "assets/",
    data: "data/",
    dest: "dist/",
    metadata: "metadata/",
    static: "static/",
    template: "templates/",
  },
  file: {
    draft: "drafts.html",
    icon: "static/favicon.svg",
  },
  name: pkg.name,
  version: pkg.version,
};
