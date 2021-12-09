import {
	escapeCharacters,
	unescapeReferences
} from "../lib/character-reference.js";
import config from "../.config.js";
import fs from "fs/promises";
import minimist from "minimist";
import mustache from "mustache";
import os from "os";
import { outputFile } from "../lib/output-file.js";
import path from "path";
import { readJSONFile } from "../lib/json-file.js";
import { runCommand } from "../lib/run-command.js";
import { validateHTML } from "../lib/validate-html.js";

const getDraft = async (file) => {
	const content = await fs.readFile(file, "utf8");
	const [
		title,
		...rest
	] = content.split("\n");
	const body = rest
		.join("\n")
		.trim()
		.replace(/(?<=\b(href|src)=")\.\.\/dist\//gu, "/");
	return {
		body,
		title: unescapeReferences(title.replace(/<.*?>/gu, ""))
	};
};

const formatMessage = (file, message) =>
	`${file}:${message.lastLine + 2}:${message.lastColumn}: ${message.message}`;

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
	const { _: [ file ] } = minimist(process.argv.slice(2));

	if (!file) {
		throw new Error("A file path must be passed.");
	}

	const draft = await getDraft(file);
	const [
		dir,
		template
	] = await Promise.all([
		makeTempDir(),
		fs.readFile(config.paths.src.testArticle, "utf8"),
		validateBody(draft.body, file)
	]);
	const test = path.join(dir, "test.html");
	const toRoot = path.relative(dir, config.paths.dest.root);
	const rendered = mustache
		.render(template, draft, null, {
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
