import config from "../config.js";
import fs from "node:fs/promises";

const main = async () => {
  await fs.cp(config.dir.static, config.dir.dest, {
    recursive: true,
  });
};

main().catch((e) => {
  throw e;
});
