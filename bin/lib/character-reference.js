const characters = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&apos;",
  "<": "&lt;",
  ">": "&gt;",
};
const references = {
  "&amp;": "&",
  "&apos;": "'",
  "&gt;": ">",
  "&lt;": "<",
  "&quot;": '"',
};

const toReference = (c) => characters[c];

const escapeCharacters = (text) =>
  String(text).replace(/[<>"']|&(?!#?\w+;)/gv, toReference);

const toCharacter = (r) => references[r];

const unescapeReferences = (text) =>
  String(text).replace(/&(amp|lt|gt|quot|apos);/gv, toCharacter);

export { escapeCharacters, unescapeReferences };
