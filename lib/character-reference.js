const characters = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&apos;",
  "<": "&lt;",
  ">": "&gt;"
};
const charactersRe = /[<>"']|&(?!#?\w+;)/g;
const references = {
  "&amp;": "&",
  "&apos;": "'",
  "&gt;": ">",
  "&lt;": "<",
  "&quot;": '"'
};
const referencesRe = /&(amp|lt|gt|quot|apos);/g;

const escape = c => characters[c];

const escapeAll = text => String(text).replace(charactersRe, escape);

const unescape = c => references[c];

const unescapeAll = text => String(text).replace(referencesRe, unescape);

module.exports.escapeCharacters = escapeAll;
module.exports.unescapeReferences = unescapeAll;
