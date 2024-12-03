import config from "../config.js";
import fs from "node:fs/promises";

await fs.cp(config.dir.static, config.dir.dest, {
  recursive: true,
});
