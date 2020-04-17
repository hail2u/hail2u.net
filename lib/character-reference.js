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

const escape = (c) => characters[c];

const escapeCharacters = (text) => String(text).replace(charactersRe, escape);

const unescape = (c) => references[c];

const unescapeReferences = (text) => String(text).replace(referencesRe, unescape);

export { escapeCharacters, unescapeReferences };
