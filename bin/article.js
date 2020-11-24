import {
	readJSONFile,
	writeJSONFile,
} from "../lib/json-file.js";
import config from "./config.js";
import fs from "fs/promises";
import {
	highlight
} from "../lib/highlight.js";
import minimist from "minimist";
import mustache from "mustache";
import path from "path";
import readline from "readline";
import {
	runCommand
} from "../lib/run-command.js";
import {
	unescapeReferences
} from "../lib/character-reference.js";

const getDraft = async (filename) => {
	const src = path.join(config.src.drafts, filename);
	const content = await fs.readFile(src, "utf8");
	const [
		title,
		...rest
	] = content.split("\n");
	const body = rest.join("\n")
		.trim()
		.replace(/(?<=\b(href|src)=")\.\.(\/\.\.\/dist)?\//gu, "/");
	return {
		body,
		"name": path.basename(src, path.extname(src)),
		src,
		"title": unescapeReferences(title.replace(/<.*?>/gu, ""))
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
	const filenames = await fs.readdir(config.src.drafts);

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
			"input": process.stdin,
			"output": process.stdout
		});
		const menuitems = drafts.map(toMenuitem).join("\n");
		menu.write(`0. QUIT
${menuitems}
`);
		menu.question("Which one: (0) ", (a = 0) => {
			menu.close();
			const answer = Number.parseInt(a, 10);

			if (!Number.isInteger(answer) || answer > drafts.length) {
				throw new Error(`You must enter a number between 0 and ${drafts.length}.`);
			}

			if (answer === 0) {
				throw new Error("Aborted by user.");
			}

			return resolve(drafts[answer - 1]);
		});
	});
};

const testSelected = async (selected) => {
	const template = await fs.readFile(config.src.test, "utf8");
	const rendered = mustache
		.render(template, selected)
		.replace(/(?<=\b(href|src)=")\//gu, "../dist/");
	const highlighted = highlight(rendered);
	await fs.mkdir(path.dirname(config.dest.test), {
		recursive: true
	});
	await fs.writeFile(config.dest.test, highlighted);
	return runCommand("open", [config.dest.test]);
};

const getArticleTotal = (cache) => ` (${cache.length + 1})`;

const contributeSelected = async (selected) => {
	const [cache] = await Promise.all([
		readJSONFile(config.data.articles),
		await fs.mkdir(path.dirname(config.data.articles), {
			recursive: true
		})
	]);
	await Promise.all([
		fs.rm(selected.src),
		writeJSONFile(config.data.articles, [
			{
				"body": selected.body,
				"link": `/blog/${selected.name}.html`,
				"published": Date.now(),
				"title": selected.title
			},
			...cache
		])
	]);
	await Promise.all([
		runCommand("git", [
			"add",
			"--",
			config.data.articles
		]),
		runCommand("node", [
			"bin/html.js",
			`--article=${config.dest.articles}${selected.name}.html`
		])
	]);
	return runCommand("git", [
		"commit",
		`--message=Contribute ${selected.name}${getArticleTotal(cache)}`
	]);
};

const main = async () => {
	const argv = minimist(process.argv.slice(2), {
		"alias": {
			"t": "test"
		},
		"boolean": ["test"]
	});
	const drafts = await listDrafts(argv.test);
	const selected = await selectDraft(drafts);

	if (!/^_?[a-z0-9][-.a-z0-9]*[a-z0-9]$/u.test(selected.name)) {
		throw new Error("This draft does not have a valid name. A draft filename must start and end with \"a-z\" or \"0-9\" and must not contain other than \"-.a-z0-9\".");
	}

	if (typeof selected.title !== "string") {
		throw new Error("This draft does not have a valid title. A draft title must be a string.");
	}

	const bytes = new TextEncoder().encode(selected.title);

	if (bytes.length < 9) {
		throw new Error("This draft title is too short. A draft title must be long enough (9 in English, 3 in Japanese).");
	}

	if (argv.test) {
		return testSelected(selected);
	}

	return contributeSelected(selected);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
