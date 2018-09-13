const decodeRe = /&(amp|lt|gt|quot|apos);/g;
const decoded = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt": ">",
  "&quot;": '"',
  "&apos": "'"
};
const encodeRe = /[<>"']|&(?!#?\w+;)/g;
const encoded = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;"
};

module.exports.decode = text => String(text).replace(decodeRe, c => decoded[c]);
module.exports.encode = text => String(text).replace(encodeRe, c => encoded[c]);
