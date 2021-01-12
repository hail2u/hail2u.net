import { outputJSONFile, readJSONFile } from "../lib/json-file.js";
import config from "../.config.js";
import fs from "fs/promises";
import { highlight } from "../lib/highlight.js";
import minimist from "minimist";
import mustache from "mustache";
import os from "os";
import { outputFile } from "../lib/output-file.js";
import path from "path";
import readline from "readline";
import { runCommand } from "../lib/run-command.js";
import { unescapeReferences } from "../lib/character-reference.js";
import { validateHTML } from "../lib/validate-html.js";

const getDraft = async (filename) => {
	const src = path.join(config.paths.src.draft, filename);
	const content = await fs.readFile(src, "utf8");
	const [title, ...rest] = content.split("\n");
	const body = rest
		.join("\n")
		.trim()
		.replace(/(?<=\b(href|src)=")\.\.(\/\.\.\/dist)?\//gu, "/");
	return {
		body,
		name: path.basename(src, path.extname(src)),
		src,
		title: unescapeReferences(title.replace(/<.*?>/gu, "")),
	};
};

const getDrafts = (drafts) => Promise.all(drafts.map(getDraft));

const isDraft = (isTest, filename) => {
	if (!isTest && filename.startsWith("_")) {
		return false;
	}

	if (path.extname(filename) !== ".html") {
		return false;
	}

	return true;
};

const listDrafts = async (isTest) => {
	const filenames = await fs.readdir(config.paths.src.draft);

	if (filenames.length < 1) {
		throw new Error("There is no draft.");
	}

	return getDrafts(filenames.filter(isDraft.bind(null, isTest)));
};

const toMenuitem = (draft, i) => `${i + 1}. ${draft.title} (${draft.name})`;

const selectDraft = (drafts) => {
	if (drafts.length === 1) {
		return drafts[0];
	}

	return new Promise((resolve) => {
		process.stdin.isTTY = true;
		process.stdout.isTTY = true;
		const menu = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		const menuitems = drafts.map(toMenuitem).join("\n");
		menu.write(`0. QUIT
${menuitems}
`);
		menu.question("Which one: (0) ", (a = 0) => {
			menu.close();
			const answer = Number.parseInt(a, 10);

			if (!Number.isInteger(answer) || answer > drafts.length) {
				throw new Error(
					`You must enter a number between 0 and ${drafts.length}.`
				);
			}

			if (answer === 0) {
				throw new Error("Aborted by user.");
			}

			return resolve(drafts[answer - 1]);
		});
	});
};

const checkName = (name) => {
	if (!/^_?[a-z0-9][-.a-z0-9]*[a-z0-9]$/u.test(name)) {
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

const testSelected = async (selected) => {
	const file = new URL("../package.json", import.meta.url);
	const [tmproot, pkg] = await Promise.all([
		fs.realpath(os.tmpdir()),
		readJSONFile(file),
	]);
	const [template, tmpdir] = await Promise.all([
		fs.readFile(config.paths.src.testArticle, "utf8"),
		fs.mkdtemp(path.join(tmproot, path.sep, `${pkg.name}-`)),
	]);
	const test = path.join(tmpdir, "test.html");
	const rendered = mustache
		.render(template, selected)
		.replace(/(?<=\b(href|src)=")\//gu, "../dist/");
	const highlighted = highlight(rendered);
	await outputFile(test, highlighted);
	return runCommand("open", [test]);
};

const getArticleTotal = (cache) => ` (${cache.length + 1})`;

const contributeSelected = async (selected) => {
	const cache = await readJSONFile(config.paths.data.articles);
	await outputJSONFile(config.paths.data.articles, [
		{
			body: selected.body,
			link: path.posix.join(
				"/",
				path.relative(config.paths.dest.root, config.paths.dest.article),
				`${selected.name}.html`
			),
			published: Date.now(),
			title: selected.title,
		},
		...cache,
	]);
	await fs.rm(selected.src);
	await Promise.all([
		runCommand("git", ["add", "--", config.paths.data.articles]),
		runCommand("node", [
			"bin/html.js",
			`--article=${config.paths.dest.article}${selected.name}.html`,
		]),
	]);
	return runCommand("git", [
		"commit",
		`--message=Contribute ${selected.name}${getArticleTotal(cache)}`,
	]);
};

const main = async () => {
	const argv = minimist(process.argv.slice(2), {
		alias: {
			t: "test",
		},
		boolean: ["test"],
	});
	const drafts = await listDrafts(argv.test);
	const selected = await selectDraft(drafts);
	await Promise.all([
		checkName(selected.name),
		checkTitleLength(selected.title),
		checkTitleType(selected.title),
		validateBody(selected.body, selected.src),
	]);

	if (argv.test) {
		return testSelected(selected);
	}

	return contributeSelected(selected);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
