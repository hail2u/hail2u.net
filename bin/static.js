import config from "../config.js";
import fs from "node:fs/promises";

process.on("unhandledRejection", (e) => {
  throw e;
});

await fs.cp(config.dir.static, config.dir.dest, {
  recursive: true,
});
