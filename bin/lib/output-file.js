import fs from "node:fs/promises";
import path from "node:path";

const outputFile = async (file, data) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
};

export { outputFile };
