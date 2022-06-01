import config from "../.config.js";
import { escapeCharacters } from "../lib/character-reference.js";
import fs from "node:fs/promises";
import minimist from "minimist";
import mustache from "mustache";
import { outputFile } from "../lib/output-file.js";
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

const readData = async (filename) => {
	const name = path.basename(filename, ".json");
	const file = path.join(config.src.data, filename);
	const data = await readJSONFile(file);

	if (name !== "books") {
		const marked = await Promise.all(data.map(markItem));
		return { [ name ]: marked };
	}

	const marked = await Promise.all(data.filter(isNotComic).map(markItem));
	return { [ name ]: marked };
};

const readAllData = async () => {
	const filenames = await fs.readdir(config.src.data);
	const data = await Promise.all(filenames.map(readData));
	return Object.assign(...data);
};

const readPartial = async (dir, filename) => {
	const name = path.basename(filename, ".mustache");
	const content = await fs.readFile(path.join(dir, filename), "utf8");
	return { [ name ]: content };
};

const readPartials = async () => {
	const dir = path.join(config.src.templates, "partials");
	const filenames = await fs.readdir(dir);
	const partials = await Promise.all(filenames.map(readPartial.bind(null, dir)));
	return Object.assign(...partials);
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

const toFilesFormat = (article) => ({
	...article,
	dest: path.join(config.dest.root, article.link),
	metadata: path.join(config.src.metadata, "blog/article.json"),
	template: path.join(config.src.templates, "blog/article.mustache")
});

const main = async () => {
	const {
		all,
		latest
	} = minimist(process.argv.slice(2), {
		alias: {
			a: "all",
			l: "latest"
		},
		boolean: [
			"all",
			"latest"
		],
		default: {
			all: false,
			latest: false
		}
	});
	const pkg = new URL("../package.json", import.meta.url);
	const [
		{
			articles,
			books,
			links,
			statuses,
			subscriptions
		},
		{ version },
		partials
	] = await Promise.all([
		readAllData(),
		readJSONFile(pkg),
		readPartials()
	]);
	const data = {
		...config.metadata,
		articles,
		books,
		links,
		statuses,
		subscriptions,
		version
	};

	if (latest) {
		const article = toFilesFormat(articles[0]);
		await build(data, partials, article);
	}

	if (all) {
		const articleFiles = await Promise.all(articles.map(toFilesFormat));

		while (articleFiles.length > 0) {
			/* eslint-disable-next-line no-await-in-loop */
			await Promise.all(articleFiles
				.splice(-1024)
				.map(build.bind(null, data, partials))
			);
		}
	}

	await Promise.all(config.html.map(build.bind(null, data, partials)));
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
