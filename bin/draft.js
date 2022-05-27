import config from "../.config.js";
import { escapeCharacters } from "../lib/character-reference.js";
import fs from "node:fs/promises";
import mustache from "mustache";
import os from "node:os";
import { outputFile } from "../lib/output-file.js";
import path from "node:path";
import { readJSONFile } from "../lib/json-file.js";
import { runCommand } from "../lib/run-command.js";
import { selectDraft } from "../lib/select-draft.js";
import { validateHTML } from "../lib/validate-html.js";

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

const makeTempDir = async () => {
	const pkg = new URL("../package.json", import.meta.url);
	const [
		osTemp,
		{ name }
	] = await Promise.all([
		fs.realpath(os.tmpdir()),
		readJSONFile(pkg)
	]);
	return fs.mkdtemp(path.join(osTemp, path.sep, `${name}-`));
};

const main = async () => {
	const {
		remains,
		selected
	} = await selectDraft();
	const drafts = [
		selected,
		...remains
	]
		.map(rebuildDraft)
		.join("\n\n");
	const [
		dir,
		template
	] = await Promise.all([
		makeTempDir(),
		fs.readFile(config.paths.src.testArticle, "utf8"),
		outputFile(config.paths.src.draft, drafts),
		validateBody(selected.body, config.paths.src.draft)
	]);
	const test = path.join(dir, "test.html");
	const toRoot = path.relative(dir, config.paths.dest.root);
	const rendered = mustache
		.render(template, {
			...selected,
			body: selected.body.replace(/(?<=\b(href|src)=")\.\.\/\.\.\/dist\//gu, "/")
		}, null, {
			escape: escapeCharacters
		})
		.replace(/(?<=\b(href|src)=")\//gu, `${toRoot}/`);
	await outputFile(test, rendered);
	await runCommand("open", [ test ]);
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
