import {
	escapeCharacters,
	unescapeReferences
} from "../lib/character-reference.js";
import {
	outputJSONFile,
	readJSONFile
} from "../lib/json-file.js";
import config from "../.config.js";
import { getDateDetails } from "../lib/get-date-details.js";
import { openTwitter } from "../lib/open-twitter.js";
import { outputFile } from "../lib/output-file.js";
import path from "node:path";
import { runCommand } from "../lib/run-command.js";
import { selectDraft } from "../lib/select-draft.js";
import { validateHTML } from "../lib/validate-html.js";

const checkIDFormat = (id) => {
	if (id && !/[0-9a-z][-0-9a-z_.]*[0-9a-z]/u.test(id)) {
		throw new Error("This draft ID is not valid. ID must be started and ended with [0-9a-z], and must not contain other than [-0-9a-z_.].");
	}
};

const checkTitleLength = (title) => {
	const textEncoder = new TextEncoder();
	const bytes = textEncoder.encode(title);

	if (bytes.length < 9) {
		throw new Error("This draft title is too short. A draft title must be long enough (9 in English, 3 in Japanese).");
	}
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
	const [
		{
			remains,
			selected
		},
		cache
	] = await Promise.all([
		selectDraft(),
		readJSONFile(config.paths.data.articles)
	]);
	const body = selected.body.replace(/(?<=\b(href|src)=")\.\.\/\.\.\/dist\//gu, "/");
	const {
		id,
		title
	} = selected;
	await Promise.all([
		checkIDFormat(id),
		checkTitleLength(title),
		checkTitleType(title),
		validateBody(body, config.paths.src.draft)
	]);
	const description = unescapeReferences(body.replace(/<.*?>/gu, ""))
		.trim()
		.split("\n")
		.shift();
	const published = Date.now();
	const dt = getDateDetails(published);
	const name = generateName(dt, id);
	const link = path.posix.join(
		"/",
		path.relative(config.paths.dest.root, config.paths.dest.article),
		`${name}.html`
	);
	const drafts = remains
		.map(rebuildDraft)
		.join("\n\n");
	await Promise.all([
		outputJSONFile(config.paths.data.articles, [
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
		outputFile(config.paths.src.draft, drafts)
	]);
	await runCommand("git", [
		"add",
		"--",
		config.paths.data.articles
	]);
	const th = cache.length + 1;
	const [{
		domain,
		scheme
	}] = await Promise.all([
		readJSONFile(config.paths.metadata.root),
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
