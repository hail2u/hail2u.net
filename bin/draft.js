import config from "../.config.js";
import { escapeCharacters } from "../lib/character-reference.js";
import fs from "fs/promises";
import mustache from "mustache";
import os from "os";
import { outputFile } from "../lib/output-file.js";
import path from "path";
import { readJSONFile } from "../lib/json-file.js";
import { runCommand } from "../lib/run-command.js";
import { selectDraft } from "../lib/select-draft.js";
import { validateHTML } from "../lib/validate-html.js";

const rebuildDraft = ({
	body,
	title
}) => `<h1>${escapeCharacters(title)}</h1>

${body}
`;

const formatMessage = (file, message) => `${file}:${message.lastLine + 2}:${message.lastColumn}: ${message.message}`;

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
	const file = new URL("../package.json", import.meta.url);
	const [
		osTemp,
		pkg
	] = await Promise.all([
		fs.realpath(os.tmpdir()),
		readJSONFile(file)
	]);
	return fs.mkdtemp(path.join(osTemp, path.sep, `${pkg.name}-`));
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
		.render(template, selected, null, {
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
