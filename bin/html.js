import config from "../.config.js";
import { escapeCharacters } from "../lib/character-reference.js";
import fs from "node:fs/promises";
import { globAsync } from "../lib/glob-async.js";
import { guessPath } from "../lib/guess-path.js";
import mustache from "mustache";
import { outputFile } from "../lib/output-file.js";
import { parseArgs } from "node:util";
import path from "node:path";
import { readJSONFile } from "../lib/json-file.js";

const isNotComic = (book) => !(/（\d+）/u).test(book.title);

const isFirstInMonth = (current, previous) => {
	if (!previous || current.month !== previous.month) {
		return true;
	}

	return false;
};

const isFirstInYear = (current, previous) => {
	if (!previous || current.year !== previous.year) {
		return true;
	}

	return false;
};

const isLastInMonth = (current, next) => {
	if (!next || current.month !== next.month) {
		return true;
	}

	return false;
};

const isLastInYear = (current, next) => {
	if (!next || current.year !== next.year) {
		return true;
	}

	return false;
};

const markItem = (item, index, items) => {
	if (!item.published) {
		return item;
	}

	const nextItem = items[index + 1];
	const previousItem = items[index - 1];
	return {
		...item,
		isFirstInMonth: isFirstInMonth(item, previousItem),
		isFirstInYear: isFirstInYear(item, previousItem),
		isLastInMonth: isLastInMonth(item, nextItem),
		isLastInYear: isLastInYear(item, nextItem)
	};
};

const readData = async (file) => {
	const basename = path.basename(file, ".json");
	const data = await readJSONFile(file);

	if (basename !== "books") {
		const marked = await Promise.all(data.map(markItem));
		return { [ basename ]: marked };
	}

	const books = data.filter(isNotComic);
	const marked = await Promise.all(books.map(markItem));
	return { [ basename ]: marked };
};

const readAllData = async () => {
	const files = await globAsync(`${config.src.data}**/*.json`);
	const data = await Promise.all(files.map(readData));
	return Object.assign(...data);
};

const readPartial = async (file) => {
	const basename = path
		.basename(file, ".mustache")
		.substring(1);
	const partial = await fs.readFile(file, "utf8");
	return { [ basename ]: partial };
};

const readPartials = async () => {
	const files = await globAsync(`${config.src.templates}partials/*.mustache`);
	const partials = await Promise.all(files.map(readPartial));
	return Object.assign(...partials);
};

const toFilesFormat = (file) => {
	if (typeof file === "object") {
		return {
			...file,
			dest: path.join(config.dest.root, file.link),
			metadata: path.join(config.src.metadata, "blog/article.json"),
			template: path.join(config.src.templates, "blog/_article.mustache")
		};
	}

	return {
		dest: guessPath(file, config.dest.root, ".html"),
		metadata: guessPath(file, config.src.metadata, ".json"),
		template: file
	};
};

const gatherFiles = async () => {
	const files = await globAsync(`${config.src.templates}**/*.mustache`, { ignore: `**/_*` });
	return Promise.all(files.map(toFilesFormat));
};

const hasSameLink = (dest, article) => dest.endsWith(article.link);

const findCover = (html) => {
	const image = /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/u.exec(html);

	if (!image) {
		return {};
	}

	return {
		cover: image[1],
		twitterCard: "summary_large_image"
	};
};

const mergeData = async (file, data) => {
	const overrides = await readJSONFile(file.metadata);

	if (overrides.isArticle) {
		const article = data.articles.find(hasSameLink.bind(null, file.dest));
		const cover = findCover(article.body);
		return {
			...data,
			...overrides,
			...article,
			...cover,
			canonical: article.link
		};
	}

	return {
		...data,
		...overrides
	};
};

const markFirstItem = (items) => {
	const cloned = JSON.parse(JSON.stringify(items));
	const firstItem = cloned.shift();
	firstItem.isFirstInDate = true;
	firstItem.isFirstInMonth = true;
	firstItem.isFirstInYear = true;
	return [
		firstItem,
		...cloned
	];
};

const build = async (basic, partials, file) => {
	const [
		data,
		template
	] = await Promise.all([
		mergeData(file, basic),
		fs.readFile(file.template, "utf8")
	]);

	if (!data.isArticle && data.isBlog) {
		data.latestArticles = data.articles.slice(0, 9);
		data.articles = markFirstItem(data.articles.slice(9));
	}

	if (data.isBookshelf) {
		data.latestBooks = data.books.slice(0, 9);
		data.books = markFirstItem(data.books.slice(9));
	}

	if (data.isLinks) {
		data.latestLinks = data.links.slice(0, 9);
		data.links = markFirstItem(data.links.slice(9));
	}

	if (data.isHome) {
		data.articles = data.articles.slice(0, 6);
		data.books = data.books.slice(0, 3);
		data.links = data.links.slice(0, 6);
	}

	const rendered = mustache.render(template, data, partials, { escape: escapeCharacters });
	await outputFile(file.dest, rendered);
};

const main = async () => {
	const [
		metadata,
		{
			articles,
			books,
			links,
			statuses,
			subscriptions
		},
		partials,
		{
			values: {
				all,
				latest
			}
		},
		files
	] = await Promise.all([
		readJSONFile(path.join(config.src.metadata, "global.json")),
		readAllData(),
		readPartials(),
		parseArgs({
			options: {
				all: {
					short: "a",
					type: "boolean"
				},
				latest: {
					short: "l",
					type: "boolean"
				}
			}
		}),
		gatherFiles()
	]);
	const data = {
		...metadata,
		articles,
		books,
		links,
		statuses,
		subscriptions,
		version: config.version
	};

	if (latest) {
		const article = await toFilesFormat(articles[0]);
		await build(data, partials, article);
	}

	if (all) {
		const articleFiles = await Promise.all(articles.map(toFilesFormat));

		while (articleFiles.length > 0) {
			const chunk = articleFiles.splice(-1024);
			/* eslint-disable-next-line no-await-in-loop */
			await Promise.all(chunk.map(build.bind(null, data, partials)));
		}
	}

	await Promise.all(files.map(build.bind(null, data, partials)));
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
