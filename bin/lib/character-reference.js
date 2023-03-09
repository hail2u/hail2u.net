const characters = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&apos;",
  "<": "&lt;",
  ">": "&gt;"
};
const charactersRe = /[<>"']|&(?!#?\w+;)/gu;
const references = {
  "&amp;": "&",
  "&apos;": "'",
  "&gt;": ">",
  "&lt;": "<",
  "&quot;": '"'
};
const referencesRe = /&(amp|lt|gt|quot|apos);/gu;

const toReference = (c) => characters[c];

const escapeCharacters = (text) => String(text).replace(charactersRe, toReference);

const toCharacter = (r) => references[r];

const unescapeReferences = (text) => String(text).replace(referencesRe, toCharacter);

export {
  escapeCharacters,
  unescapeReferences
};
