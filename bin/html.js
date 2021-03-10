import {
	escapeCharacters,
	unescapeReferences,
} from "../lib/character-reference.js";
import config from "../.config.js";
import fs from "fs/promises";
import { getDateDetails } from "../lib/get-date-details.js";
import { highlight } from "../lib/highlight.js";
import minimist from "minimist";
import mustache from "mustache";
import { outputFile } from "../lib/output-file.js";
import path from "path";
import { readJSONFile } from "../lib/json-file.js";

const extendArticle = (article) => {
	const dt = getDateDetails(new Date(article.published));
	const description = unescapeReferences(article.body.replace(/<.*?>/gu, ""))
		.trim()
		.split("\n")
		.shift();
	return {
		...article,
		...dt,
		body: article.body.trim(),
		description,
		isArticle: true,
	};
};

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
		isLastInYear: isLastInYear(item, nextItem),
	};
};

const readArticles = async () => {
	const articles = await readJSONFile(config.paths.data.articles);
	return Promise.all(articles.map(extendArticle).map(markItem));
};

const extendBook = (book) => {
	const dt = getDateDetails(new Date(book.published));
	return {
		...book,
		...dt,
		isBook: true,
	};
};

const readBooks = async () => {
	const books = await readJSONFile(config.paths.data.books);
	return Promise.all(books.map(extendBook).map(markItem));
};

const extendDocument = (document) => {
	const dt = getDateDetails(new Date(document.published));
	return {
		...document,
		...dt,
		isDocument: true,
	};
};

const readDocuments = async () => {
	const documents = await readJSONFile(config.paths.data.documents);
	return Promise.all(documents.map(extendDocument).map(markItem));
};

const extendLink = (link) => {
	const dt = getDateDetails(new Date(link.published));

	return {
		...link,
		...dt,
		isLink: true,
	};
};

const readLinks = async () => {
	const links = await readJSONFile(config.paths.data.links);
	return Promise.all(links.map(extendLink).map(markItem));
};

const extendStatus = (status) => {
	const dt = getDateDetails(new Date(status.published));
	return {
		...status,
		...dt,
		isStatus: true,
	};
};

const readStatuses = async () => {
	const statuses = await readJSONFile(config.paths.data.statuses);
	return Promise.all(statuses.map(extendStatus).map(markItem));
};

const readSubscriptions = async () => {
	const subscriptions = await readJSONFile(config.paths.data.subscriptions);
	const lastItem = subscriptions.pop();
	return [
		...subscriptions,
		{
			...lastItem,
			isLast: true,
		},
	];
};

const readPartial = async (filename) => {
	const name = path.basename(filename, ".mustache");
	const content = await fs.readFile(
		path.join(config.paths.src.partial, filename),
		"utf8"
	);
	return {
		[name]: content,
	};
};

const gatherPartials = (partials) => Object.assign(...partials);

const readPartials = async () => {
	const filenames = await fs.readdir(config.paths.src.partial);
	const partials = await Promise.all(filenames.map(readPartial));
	return gatherPartials(partials);
};

const hasSameLink = (dest, article) => dest.endsWith(article.link);

const findCover = (html) => {
	const image = /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/u.exec(html);

	if (!image) {
		return {};
	}

	return {
		cover: image[1],
		twitterCard: "summary_large_image",
	};
};

const mergeData = async (file, metadata) => {
	const overrides = await readJSONFile(file.metadata);

	if (overrides.isWeblogArticle) {
		const article = metadata.articles.find(hasSameLink.bind(null, file.dest));
		const cover = findCover(article.body);
		return {
			...metadata,
			...overrides,
			...article,
			...cover,
			canonical: article.link,
		};
	}

	return {
		...metadata,
		...overrides,
	};
};

const markFirstItem = (items) => {
	const firstItem = items.shift();
	firstItem.isFirstInMonth = true;
	firstItem.isFirstInYear = true;
	return [firstItem, ...items];
};

const build = async (basicData, partials, file) => {
	const [data, template] = await Promise.all([
		mergeData(file, basicData),
		fs.readFile(file.src, "utf8"),
	]);

	if (data.isBookshelf && !data.isLog) {
		data.otherBooks = data.books.slice(9);
		data.otherBooks = markFirstItem(data.otherBooks);
		data.numOtherBooks = data.otherBooks.length;
		data.books = data.books.slice(0, 9);
	}

	if (data.isHome) {
		data.articles = data.articles.slice(0, 6);
		data.books = data.books.slice(0, 3);
		data.documents = data.documents.slice(0, 1);
		data.links = data.links.slice(0, 6);
		data.statuses = data.statuses.slice(0, 1);
	}

	const rendered = mustache.render(template, data, partials, {
		escape: escapeCharacters,
	});
	const highlighted = highlight(rendered);
	await outputFile(file.dest, highlighted);
};

const toFilesFormat = (article) => ({
	dest: path.join(config.paths.dest.root, article.link),
	metadata: config.paths.metadata.article,
	src: config.paths.src.article,
	...article,
});

const main = async () => {
	const { all, latest } = minimist(process.argv.slice(2), {
		alias: {
			a: "all",
			l: "latest",
		},
		boolean: ["all", "latest"],
		default: {
			all: false,
			latest: false,
		},
	});
	const file = new URL("../package.json", import.meta.url);
	const [
		metadata,
		articles,
		books,
		documents,
		links,
		statuses,
		subscriptions,
		partials,
		{ version },
	] = await Promise.all([
		readJSONFile(config.paths.metadata.root),
		readArticles(),
		readBooks(),
		readDocuments(),
		readLinks(),
		readStatuses(),
		readSubscriptions(),
		readPartials(),
		readJSONFile(file),
	]);
	const data = {
		...metadata,
		articles,
		books,
		documents,
		links,
		statuses,
		subscriptions,
		version,
	};

	if (latest) {
		const article = toFilesFormat(articles[0]);
		await build(data, partials, article);
	}

	if (all) {
		const articleFiles = await Promise.all(articles.map(toFilesFormat));

		while (articleFiles.length > 0) {
			/* eslint-disable-next-line no-await-in-loop */
			await Promise.all(
				articleFiles.splice(-1024).map(build.bind(null, data, partials))
			);
		}
	}

	await Promise.all(config.files.html.map(build.bind(null, data, partials)));
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
