import {
	escapeCharacters,
	unescapeReferences
} from "../lib/character-reference.js";
import {
	outputJSONFile,
	readJSONFile
} from "../lib/json-file.js";
import config from "../.config.js";
import { constants } from "node:fs";
import fs from "node:fs/promises";
import { getDateDetails } from "../lib/get-date-details.js";
import { openTwitter } from "../lib/open-twitter.js";
import { outputFile } from "../lib/output-file.js";
import path from "node:path";
import readline from "node:readline/promises";
import { runCommand } from "../lib/run-command.js";
import { selectDraft } from "../lib/select-draft.js";
import { validateHTML } from "../lib/validate-html.js";

const checkIDFormat = (id) => {
	if (id && !/[0-9a-z][-.0-9a-z]*[0-9a-z]/u.test(id)) {
		throw new Error("This draft ID is not valid. ID must start and end with “0-9” or “a-z”, and must not contain other than “-.a-z0-9”.");
	}
};

const checkNameConflict = async (name) => {
	const file = path.join(config.dest.article, `${name}.html`);

	try {
		await fs.access(file, constants.F_OK);
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

const formatMessage = (file, {
	lastColumn,
	lastLine,
	message
}) => `${file}:${lastLine + 2}:${lastColumn}: ${message}`;

const validateBody = async (body, src) => {
	const messages = await validateHTML(`<!doctype html><title>_</title>${body}`);

	if (!messages) {
		return;
	}

	if (typeof messages === "string") {
		process.stdout.write(`${src}:1:1: ${messages}
`);
		return;
	}

	if (messages.length > 0) {
		const errors = messages.map(formatMessage.bind(null, src));
		process.stdout.write(errors.join("\n"));
		process.stdout.write("\n\n");
		throw new Error(`${errors.length} error(s) in ${src}`);
	}
};

const confirmPublishing = async ({
	day,
	strDate,
	strMonth,
	strYear
}) => {
	const holidays = [
		"20220101",
		"20220110",
		"20220211",
		"20220223",
		"20220321",
		"20220429",
		"20220503",
		"20220504",
		"20220505",
		"20220718",
		"20220811",
		"20220919",
		"20220923",
		"20221010",
		"20221103",
		"20221123",
		"20230101",
		"20230102",
		"20230109",
		"20230211",
		"20230223",
		"20230321",
		"20230429",
		"20230503",
		"20230504",
		"20230505",
		"20230717",
		"20230811",
		"20230918",
		"20230923",
		"20231009",
		"20231103",
		"20231123"
	];

	if (day !== 0 && !holidays.includes(`${strYear}${strMonth}${strDate}`)) {
		return;
	}

	const menu = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	const input = await menu.question("Today is Sunday or holiday. Are you sure you want to publish an article? (No) ");
	menu.close();
	const answer = input.toLowerCase();

	if (typeof answer === "string" && (answer !== "y" || answer !== "yes")) {
		throw new Error("Aborted.");
	}
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
	const file = config.contents.articles;
	const [
		{
			remains,
			selected
		},
		cache
	] = await Promise.all([
		selectDraft(),
		readJSONFile(file)
	]);
	const body = selected.body.replace(/(?<=\b(href|src)=")\.\.\/\.\.\/dist\//gu, "/");
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
	await confirmPublishing(dt);
	const link = path.posix.join(
		"/",
		path.relative(config.dest.root, config.dest.article),
		`${name}.html`
	);
	const drafts = remains
		.map(rebuildDraft)
		.join("\n\n");
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
			...cache
		]),
		outputFile(config.src.draft, drafts)
	]);
	await runCommand("git", [
		"add",
		"--",
		file
	]);
	const th = cache.length + 1;
	const [{
		domain,
		scheme
	}] = await Promise.all([
		readJSONFile(config.metadata.root),
		runCommand("git", [
			"commit",
			`--message=Contribute ${name} (${th})`
		])
	]);
	await openTwitter(`${title} ${scheme}://${domain}${link}`);
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
