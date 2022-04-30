import config from "../.config.js";
import { escapeCharacters } from "../lib/character-reference.js";
import fs from "node:fs/promises";
import minimist from "minimist";
import mustache from "mustache";
import { outputFile } from "../lib/output-file.js";
import path from "node:path";
import { readJSONFile } from "../lib/json-file.js";

const isNotComic = (book) => !(/（\d+）/u).test(book.title);

const isFirstInDate = (current, previous) => {
	if (!previous || current.date !== previous.date) {
		return true;
	}

	return false;
};

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

const isLastInDate = (current, next) => {
	if (!next || current.date !== next.date) {
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
	const nextItem = items[index + 1];
	const previousItem = items[index - 1];
	return {
		...item,
		isFirstInDate: isFirstInDate(item, previousItem),
		isFirstInMonth: isFirstInMonth(item, previousItem),
		isFirstInYear: isFirstInYear(item, previousItem),
		isLastInDate: isLastInDate(item, nextItem),
		isLastInMonth: isLastInMonth(item, nextItem),
		isLastInYear: isLastInYear(item, nextItem)
	};
};

const readItems = async (file) => {
	const items = await readJSONFile(file);

	if (items[0].type === "book") {
		return Promise.all(items.filter(isNotComic).map(markItem));
	}

	return Promise.all(items.map(markItem));
};

const readPartial = async (filename) => {
	const name = path.basename(filename, ".mustache");
	const content = await fs.readFile(path.join(config.paths.src.partial, filename), "utf8");
	return { [ name ]: content };
};

const readPartials = async () => {
	const filenames = await fs.readdir(config.paths.src.partial);
	const partials = await Promise.all(filenames.map(readPartial));
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

	if (overrides.isWeblogArticle) {
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

const build = async (basic, partials, file) => {
	const [
		data,
		template
	] = await Promise.all([
		mergeData(file, basic),
		fs.readFile(file.src, "utf8")
	]);

	if (data.isHome) {
		data.articles = data.articles.slice(0, 6);
		data.books = data.books.slice(0, 3);
		data.documents = data.documents.slice(0, 1);
		data.links = data.links.slice(0, 6);
	}

	const rendered = mustache.render(template, data, partials, { escape: escapeCharacters });
	await outputFile(file.dest, rendered);
};

const toFilesFormat = (article) => ({
	dest: path.join(config.paths.dest.root, article.link),
	metadata: config.paths.metadata.article,
	src: config.paths.src.article,
	...article
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
	const file = new URL("../package.json", import.meta.url);
	const [
		metadata,
		articles,
		books,
		documents,
		links,
		subscriptions,
		partials,
		{ version }
	] = await Promise.all([
		readJSONFile(config.paths.metadata.root),
		readItems(config.paths.data.articles),
		readItems(config.paths.data.books),
		readItems(config.paths.data.documents),
		readItems(config.paths.data.links),
		readJSONFile(config.paths.data.subscriptions),
		readPartials(),
		readJSONFile(file)
	]);
	const data = {
		...metadata,
		articles,
		books,
		documents,
		links,
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

	await Promise.all(config.files.html.map(build.bind(null, data, partials)));
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
