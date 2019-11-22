import { promises as fs } from "fs";

const readJSONFile = async file => {
  const json = await fs.readFile(file, "utf8");
  return JSON.parse(json);
};

const writeJSONFile = (file, obj) => fs.writeFile(file, `${JSON.stringify(obj, null, 2)}
`);

export { readJSONFile, writeJSONFile };
