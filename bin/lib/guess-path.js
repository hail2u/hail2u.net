import config from "../../config.js";
import path from "node:path";

const guessPath = (template, dir, filename) => {
  const filepath = template.replace(config.dir.template, dir);
  const dirname = path.dirname(filepath);
  return path.join(dirname, filename);
};

export { guessPath };
