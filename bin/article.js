import { outputJSONFile, readJSONFile } from "../lib/json-file.js";
import config from "../.config.js";
import fs from "fs/promises";
import { getDateDetails } from "../lib/get-date-details.js";
import minimist from "minimist";
import { openTwitter } from "../lib/open-twitter.js";
import path from "path";
import { runCommand } from "../lib/run-command.js";
import { unescapeReferences } from "../lib/character-reference.js";
import { validateHTML } from "../lib/validate-html.js";

const getArticle = async (file) => {
	const content = await fs.readFile(file, "utf8");
	const [title, ...rest] = content.split("\n");
	const body = rest
		.join("\n")
		.trim()
		.replace(/(?<=\b(href|src)=")\.\.(\/\.\.\/dist)?\//gu, "/");
	return {
		body,
		name: path.basename(file, path.extname(file)),
		src: file,
		title: unescapeReferences(title.replace(/<.*?>/gu, "")),
	};
};

const checkName = (name) => {
	if (!/^[a-z0-9][-.a-z0-9]*[a-z0-9]$/u.test(name)) {
		throw new Error(
			'This draft does not have a valid name. A draft filename must start and end with "a-z" or "0-9" and must not contain other than "-.a-z0-9".'
		);
	}
};

const checkTitleLength = (title) => {
	const textEncoder = new TextEncoder();
	const bytes = textEncoder.encode(title);

	if (bytes.length < 9) {
		throw new Error(
			"This draft title is too short. A draft title must be long enough (9 in English, 3 in Japanese)."
		);
	}
};

const checkTitleType = (title) => {
	if (typeof title !== "string") {
		throw new Error(
			"This draft does not have a valid title. A draft title must be a string."
		);
	}
};

const formatMessage = (file, message) =>
	`${file}:${message.lastLine + 2}:${message.lastColumn}: ${message.message}`;

const validateBody = async (body, src) => {
	const messages = await validateHTML(`<!doctype html><title>_</title>${body}`);

	if (typeof messages === "string") {
		process.stdout.write(`${src}:1:1: ${messages}
`);
		return;
	}

	if (messages.length > 0) {
		const errors = messages.map(formatMessage.bind(null, src));
		process.stderr.write(errors.join("\n"));
		process.stderr.write("\n\n");
		throw new Error(`${errors.length} error(s) in ${src}`);
	}
};

const main = async () => {
	const {
		_: [file],
	} = minimist(process.argv.slice(2));

	if (!file) {
		throw new Error(`A file path must be passed.`);
	}

	const [{ body, name, src, title }, cache] = await Promise.all([
		getArticle(file),
		readJSONFile(config.paths.data.articles),
	]);
	await Promise.all([
		checkName(name),
		checkTitleLength(title),
		checkTitleType(title),
		validateBody(body, src),
	]);
	const description = unescapeReferences(body.replace(/<.*?>/gu, ""))
		.trim()
		.split("\n")
		.shift();
	const link = path.posix.join(
		"/",
		path.relative(config.paths.dest.root, config.paths.dest.article),
		`${name}.html`
	);
	const published = Date.now();
	const dt = getDateDetails(published);
	await outputJSONFile(config.paths.data.articles, [
		{
			body,
			description,
			link,
			published,
			...dt,
			title,
			type: "article",
		},
		...cache,
	]);
	await Promise.all([
		fs.rm(src),
		runCommand("git", ["add", "--", config.paths.data.articles]),
	]);
	const th = cache.length + 1;
	const [{ domain, scheme }] = await Promise.all([
		readJSONFile(config.paths.metadata.root),
		runCommand("git", ["commit", `--message=Contribute ${name} (${th})`]),
	]);
	const url = `${scheme}://${domain}${link}`;
	await openTwitter(`${title} ${url}`);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
