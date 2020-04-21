import config from "./index.js";
import { promises as fs } from "fs";
import highlight from "../lib/highlight.js";
import minimist from "minimist";
import mustache from "mustache";
import path from "path";
import { readJSONFile, writeJSONFile } from "../lib/json-file.js";
import readline from "readline";
import runCommand from "../lib/run-command.js";
import { unescapeReferences } from "../lib/character-reference.js";
import which from "which";

const getDraft = async (filename) => {
	const src = path.join(config.src.drafts, filename);
	const content = await fs.readFile(src, "utf8");
	const [title, ...rest] = content.split("\n");
	const body = rest.join("\n")
		.trim()
		.replace(/(?<=\b(href|src)=")\.\.(\/\.\.\/dist)?\//g, "/")
		.replace(/^<aside>/, '<aside class="affiliate">')
		.replace(/^<figure>/, '<figure class="hero">')
		.replace(/<h2>/g, '<h2 class="subheading">');
	return {
		body: `${body}`,
		name: path.basename(src, path.extname(src)),
		src: src,
		title: unescapeReferences(title.replace(/<.*?>/g, ""))
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

const selectDraft = (drafts) => new Promise((resolve) => {
	process.stdin.isTTY = true;
	process.stdout.isTTY = true;
	const menu = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	menu.write("0. QUIT\n");
	drafts.forEach((n, i) => {
		menu.write(`${i + 1}. ${n.title}
`);
	});
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
		throw new Error('This draft does not have a valid name. A draft filename must start and end with "a-z" or "0-9" and must not contain other than "-.a-z0-9".');
	}

	return true;
};

const checkSelectedNameConflict = (name) => fs.access(path.join(config.src.articles, `${name}.html`))
	.then(() => {
		throw new Error("The name of this draft is already used. A draft name must be unique.");
	})
	.catch((err) => {
		if (err.code === "ENOENT") {
			return true;
		}

		throw err;
	});

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
		fs.writeFile(config.dest.test, highlight(rendered))
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

const copyArticleImage = (imagepath) => {
	const src = path.join(config.src.articleImages, imagepath);
	const dest = path.join(config.dest.articleImages, imagepath);
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
	const [git, node] = await Promise.all([
		which("git"),
		which("node"),
		fs.unlink(selected.src),
		copyArticleImages(selected.body),
		fs.writeFile(articlePath, selected.body),
		writeJSONFile(config.data.articles, [{
			link: `/blog/${selected.name}.html`,
			published: Date.now(),
			title: selected.title
		}, ...cache])
	]);
	await Promise.all([
		runCommand(git, ["add", "--", articlePath, config.data.articles]),
		runCommand(node, ["bin/html.js", `--article=${config.dest.articles}${selected.name}.html`])
	]);
	return runCommand(git, ["commit", `--message=Contribute ${selected.name}${getArticleTotal(cache)}`]);
};

const main = async () => {
	const argv = minimist(process.argv.slice(2), {
		alias: {
			t: "test"
		},
		boolean: ["test"]
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
