const characters = {
	'"': "&quot;",
	"&": "&amp;",
	"'": "&apos;",
	"<": "&lt;",
	">": "&gt;",
};
const charactersRe = /[<>"']|&(?!#?\w+;)/gu;
const references = {
	"&amp;": "&",
	"&apos;": "'",
	"&gt;": ">",
	"&lt;": "<",
	"&quot;": '"',
};
const referencesRe = /&(amp|lt|gt|quot|apos);/gu;

const escape = (c) => characters[c];

const escapeCharacters = (text) => String(text).replace(charactersRe, escape);

const unescape = (c) => references[c];

const unescapeReferences = (text) =>
	String(text).replace(referencesRe, unescape);

export { escapeCharacters, unescapeReferences };
