import hljs from "highlight.js";
import { unescapeReferences } from "./character-reference.js";

const codeRe = /<code class="language-(\w+?)">([\s\S]*?)<\/code>/gu;

const highlightCode = (matched, language, code) => {
	const highlighted = hljs.highlight(language, unescapeReferences(code), true);
	return `<code class="highlight language-${language}">${highlighted.value}</code>`;
};

const highlight = (html) => html.replace(codeRe, highlightCode);

export { highlight };
