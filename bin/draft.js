import {
	formatMessage,
	validateHTML,
	writeErrors
} from "../lib/validate-html.js";
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

const validateBody = async (body, src) => {
	const messages = await validateHTML(`<!doctype html><title>_</title>${body}`);

	if (!messages) {
		return;
	}

	const errors = await Promise.all(messages.map(formatMessage.bind(null, src, 2)));
	writeErrors(errors, [src]);
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
	const drafts = await Promise.all([
		selected,
		...remains
	].map(rebuildDraft));
	const [
		dir,
		template
	] = await Promise.all([
		makeTempDir(),
		fs.readFile(path.join(config.src.templates, "blog/_test.mustache"), "utf8"),
		outputFile(config.src.draft, drafts.join("\n\n")),
		validateBody(selected.body, config.src.draft)
	]);
	const test = path.join(dir, "test.html");
	const toRoot = path.relative(dir, config.dest.root);
	const rendered = mustache
		.render(template, {
			...selected,
			body: selected.body.replace(/(?<=\b(href|src)=")\.\/dist\//gu, "/")
		}, null, { escape: escapeCharacters })
		.replace(/(?<=\b(href|src)=")\//gu, `${toRoot}/`);
	await outputFile(test, rendered);
	await runCommand("open", [ test ]);
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
