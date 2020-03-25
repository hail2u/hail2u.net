import hljs from "highlight.js";
import { unescapeReferences } from "./character-reference.js";

const codeRe = /<code class="language-(\w+?)">([\s\S]*?)<\/code>/g;

const highlightCode = (matched, language, code) => {
	const highlighted = hljs.highlight(
		language,
		unescapeReferences(code),
		true
	);
	return `<code class="hljs language-${language}">${highlighted.value}</code>`;
};

export default html => html.replace(codeRe, highlightCode);
