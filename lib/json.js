const fs = require("fs").promises;

const read = async file => {
  const json = await fs.readFile(file, "utf8");
  return JSON.parse(json);
};

const write = (file, obj) => fs.writeFile(file, `${JSON.stringify(obj, null, 2)}
`);

module.exports.readJSONFile = read;
module.exports.writeJSONFile = write;
