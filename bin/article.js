import {
	escapeCharacters,
	unescapeReferences
} from "./lib/character-reference.js";
import {
	formatMessage,
	validateHTML,
	writeErrors
} from "./lib/validate-html.js";
import {
	outputJSONFile,
	readJSONFile
} from "./lib/json-file.js";
import config from "../config.js";
import fs from "node:fs/promises";
import { getDateDetails } from "./lib/get-date-details.js";
import { openTwitter } from "./lib/open-twitter.js";
import { outputFile } from "./lib/output-file.js";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import { selectDraft } from "./lib/select-draft.js";

const checkIDFormat = (id) => {
	if (id && !/[0-9a-z][-.0-9a-z]*[0-9a-z]/u.test(id)) {
		throw new Error("This draft ID is not valid. ID must start and end with “0-9” or “a-z”, and must not contain other than “-.a-z0-9”.");
	}
};

const checkNameConflict = async (name) => {
	const file = path.join(config.dest.article, `${name}.html`);

	try {
		await fs.access(file, fs.constants.F_OK);
	} catch (e) {
		return true;
	}

	throw new Error(`“${name}” is already used.`);
};

const checkTitleType = (title) => {
	if (typeof title !== "string") {
		throw new Error("This draft does not have a valid title. A draft title must be a string.");
	}
};

const validateBody = async (body, src) => {
	const messages = await validateHTML(`<!doctype html><title>_</title>${body}`);

	if (!messages) {
		return;
	}

	const errors = await Promise.all(messages.map(formatMessage.bind(null, src, 2)));
	writeErrors(errors, [src]);
};

const generateName = ({
	strDate,
	strMonth,
	strYear
}, id) => {
	if (id) {
		return id;
	}

	return `${strYear}-${strMonth}-${strDate}`;
};

const rebuildDraft = ({
	body,
	id,
	title
}) => {
	if (id) {
		return `<h1 id="${id}">${escapeCharacters(title)}</h1>

${body}
`;
	}

	return `<h1>${escapeCharacters(title)}</h1>

${body}
`;
};

const main = async () => {
	const file = path.join(config.src.data, "articles.json");
	const [
		{
			remains,
			selected
		},
		articles
	] = await Promise.all([
		selectDraft(),
		readJSONFile(file)
	]);
	const body = selected.body.replace(/(?<=\b(href|src)=")\.\/dist\//gu, "/");
	const {
		id,
		title
	} = selected;
	const description = unescapeReferences(body.replace(/<.*?>/gu, ""))
		.trim()
		.split("\n")
		.shift();
	const published = Date.now();
	const dt = getDateDetails(published);
	const name = generateName(dt, id);
	await Promise.all([
		checkIDFormat(id),
		checkNameConflict(name),
		checkTitleType(title),
		validateBody(body, config.src.draft)
	]);
	const link = path.posix.join("/", path.relative(config.dest.root, config.dest.article), `${name}.html`);
	const drafts = await Promise.all(remains.map(rebuildDraft));
	await Promise.all([
		outputJSONFile(file, [
			{
				body,
				description,
				link,
				published,
				...dt,
				title,
				type: "article"
			},
			...articles
		]),
		outputFile(config.src.draft, drafts.join("\n\n"))
	]);
	await runCommand("git", [
		"add",
		"--",
		file
	]);
	const th = articles.length + 1;
	const [{
		domain,
		scheme
	}] = await Promise.all([
		readJSONFile(path.join(config.src.metadata, "global.json")),
		runCommand("git", [
			"commit",
			`--message=Contribute ${name} (${th})`
		])
	]);
	await openTwitter(`${scheme}://${domain}${link}`);
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
