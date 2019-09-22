const decodeRe = /&(amp|lt|gt|quot|apos);/g;
const encodeRe = /[<>"']|&(?!#?\w+;)/g;
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

const decode = c => decoded[c];

const encode = c => encoded[c];

module.exports.decodeHTMLEntities = text =>
  String(text).replace(decodeRe, decode);

module.exports.encodeHTMLEntities = text =>
  String(text).replace(encodeRe, encode);
