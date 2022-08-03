import config from "../config.js";
import fs from "node:fs/promises";
import readline from "node:readline/promises";
import { unescapeReferences } from "./character-reference.js";

const toDraft = (draft) => {
	const [
		first,
		...rest
	] = draft.split("\n");
	const body = rest
		.join("\n")
		.trim();
	const [
		,
		id,
		title
	] = first.match(/<h1(?: id="(.*?)")?>(.*?)<\/h1>/u);
	return {
		body,
		id,
		title: unescapeReferences(title.replace(/<.*?>/gu, ""))
	};
};

const toMenuitem = ({ title }, index) => `${String(index + 1)}. ${title}`;

const selectDraft = async () => {
	const menu = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	const html = await fs.readFile(config.src.draft, "utf8");
	const sections = html.split("\n\n\n");
	const drafts = await Promise.all(sections.map(toDraft));
	const menuitems = await Promise.all(drafts.map(toMenuitem));
	const menulist = menuitems.join("\n");
	menu.write(`0. QUIT
${menulist}
`);
	const input = await menu.question("Which one? (0) ");
	menu.close();
	const answer = parseInt(input, 10);

	if (!Number.isInteger(answer) || answer > drafts.length) {
		throw new Error(`You must enter a number between 0 and ${drafts.length}.`);
	}

	if (answer === 0) {
		throw new Error("Aborted.");
	}

	const [ selected ] = drafts.splice(answer - 1, 1);
	return {
		remains: drafts,
		selected
	};
};

export { selectDraft };
