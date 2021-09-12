import hljs from "highlight.js";
import { unescapeReferences } from "./character-reference.js";

const codeRe = /<code class="language-(\w+?)">([\s\S]*?)<\/code>/gu;

const highlightCode = (matched, language, code) => {
	const { value } = hljs.highlight(unescapeReferences(code), {
		ignoreIllegals: true,
		language
	});
	return `<code class="highlight language-${language}">${value}</code>`;
};

const highlight = (html) => html.replace(codeRe, highlightCode);

export { highlight };
