import {
	outputJSONFile,
	readJSONFile
} from "../lib/json-file.js";
import config from "./config.js";
import fs from "fs/promises";
import {
	highlight
} from "../lib/highlight.js";
import minimist from "minimist";
import mustache from "mustache";
import {
	outputFile
} from "../lib/output-file.js";
import path from "path";
import readline from "readline";
import {
	runCommand
} from "../lib/run-command.js";
import {
	unescapeReferences
} from "../lib/character-reference.js";
import which from "which";

const getDraft = async (filename) => {
	const src = path.join(config.src.drafts, filename);
	const content = await fs.readFile(src, "utf8");
	const [
		title,
		...rest
	] = content.split("\n");
	const body = rest.join("\n")
		.trim()
		.replace(/(?<=\b(href|src)=")\.\.(\/\.\.\/dist)?\//g, "/");
	return {
		"body": `${body}`,
		"name": path.basename(src, path.extname(src)),
		"src": src,
		"title": unescapeReferences(title.replace(/<.*?>/g, ""))
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

const toMenuitem = (draft, i) => `${i + 1}. ${draft.title}`;

const selectDraft = (drafts) => new Promise((resolve) => {
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

const checkSelectedName = (name) => {
	if (!/^_?[a-z0-9][-.a-z0-9]*[a-z0-9]$/.test(name)) {
		throw new Error("This draft does not have a valid name. A draft filename must start and end with \"a-z\" or \"0-9\" and must not contain other than \"-.a-z0-9\".");
	}

	return true;
};

const handleConflict = () => {
	throw new Error("The name of this draft is already used. A draft name must be unique.");
};

const handleNotConflict = (e) => {
	if (e.code === "ENOENT") {
		return true;
	}

	throw e;
};

const checkSelectedNameConflict = (name) => {
	const filename = path.join(config.src.articles, `${name}.html`);
	return fs.access(filename)
		.then(handleConflict)
		.catch(handleNotConflict);
};

const checkSelectedTitle = (title) => {
	if (typeof title !== "string") {
		throw new Error("This draft does not have a valid title. A draft title must be a string.");
	}

	return true;
};

const checkSelectedTitleLength = (title) => {
	const bytes = (new TextEncoder().encode(title));

	if (bytes.length < 9) {
		throw new Error("This draft title is too short. A draft title must be long enough (9 in English, 3 in Japanese).");
	}

	return true;
};

const testSelected = async (selected) => {
	const template = await fs.readFile(config.src.test, "utf8");
	const rendered = mustache
		.render(template, selected)
		.replace(/(?<=\b(href|src)=")\/img\//g, "../src/img/")
		.replace(/(?<=\bhref=")\//g, "../dist/");
	const [open] = await Promise.all([
		which("open"),
		outputFile(config.dest.test, highlight(rendered))
	]);
	return runCommand(open, [config.dest.test]);
};

const toImagePath = (str) => path.basename(str.split(/"/)[1]);

const listArticleImagePaths = (html) => {
	const images = html.match(/\bsrc="\/img\/blog\/.*?"/g);

	if (!images) {
		return [];
	}

	return Promise.all(images.map(toImagePath));
};

const copyArticleImage = async (imagepath) => {
	const src = path.join(config.src.articleImages, imagepath);
	const dest = path.join(config.dest.articleImages, imagepath);
	await fs.mkdir(config.dest.articleImages, {
		"recursive": true
	})
	fs.copyFile(src, dest);
};

const copyArticleImages = async (html) => {
	const imagePaths = await listArticleImagePaths(html);
	return Promise.all(imagePaths.map(copyArticleImage));
};

const getArticleTotal = (cache) => ` (${cache.length + 1})`;

const contributeSelected = async (selected) => {
	const articlePath = path.join(config.src.articles, `${selected.name}.html`);
	const cache = await readJSONFile(config.data.articles);
	const [
		git,
		node
	] = await Promise.all([
		which("git"),
		which("node"),
		fs.unlink(selected.src),
		copyArticleImages(selected.body),
		outputFile(articlePath, selected.body),
		outputJSONFile(config.data.articles, [
			{
				"link": `/blog/${selected.name}.html`,
				"published": Date.now(),
				"title": selected.title
			},
			...cache
		])
	]);
	await Promise.all([
		runCommand(git, [
			"add",
			"--",
			articlePath,
			config.data.articles
		]),
		runCommand(node, [
			"bin/txt.js",
			`--article=${config.dest.articles}${selected.name}.html`
		])
	]);
	return runCommand(git, [
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
	await Promise.all([
		checkSelectedName(selected.name),
		checkSelectedNameConflict(selected.name),
		checkSelectedTitle(selected.title),
		checkSelectedTitleLength(selected.title)
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
