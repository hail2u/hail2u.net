const decoded = {
  "&amp;": "&",
  "&apos;": "'",
  "&gt;": ">",
  "&lt;": "<",
  "&quot;": '"'
};
const encoded = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&apos;",
  "<": "&lt;",
  ">": "&gt;"
};
const decodeRe = /&(amp|lt|gt|quot|apos);/g;
const encodeRe = /[<>"']|&(?!#?\w+;)/g;

const decode = c => decoded[c];
const encode = c => encoded[c];

module.exports.decode = text => String(text).replace(decodeRe, decode);
module.exports.encode = text => String(text).replace(encodeRe, encode);
