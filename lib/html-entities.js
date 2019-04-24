const decoded = {
  "&amp;": "&",
  "&apos;": "'",
  "&gt;": ">",
  "&lt;": "<",
  "&quot;": '"'
};
const decodeRe = /&(amp|lt|gt|quot|apos);/g;
const encoded = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&apos;",
  "<": "&lt;",
  ">": "&gt;"
};
const encodeRe = /[<>"']|&(?!#?\w+;)/g;

module.exports.decode = text => String(text).replace(decodeRe, c => decoded[c]);
module.exports.encode = text => String(text).replace(encodeRe, c => encoded[c]);
