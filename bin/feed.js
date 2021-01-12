import {
	escapeCharacters,
	unescapeReferences,
} from "../lib/character-reference.js";
import config from "../.config.js";
import fs from "fs/promises";
import mustache from "mustache";
import { outputFile } from "../lib/output-file.js";
import { readJSONFile } from "../lib/json-file.js";

const toAbsoluteURL = (prefix, url) => {
	if (!url.startsWith("/")) {
		return url;
	}

	return `${prefix}${url}`;
};

const toAbsoluteURLAll = (prefix, match, attr, url) =>
	`${attr}="${toAbsoluteURL(prefix, url)}"`;

const extendArticle = (prefix, article) => {
	const description = unescapeReferences(article.body.replace(/<.*?>/gu, ""))
		.trim()
		.split("\n")
		.shift();
	return {
		...article,
		body: article.body.replace(
			/(href|src)="(\/.*?)"/gu,
			toAbsoluteURLAll.bind(null, prefix)
		),
		description,
		ifttt: `${article.title} ${toAbsoluteURL(prefix, article.link)}`,
		type: "article",
	};
};

const readArticles = async (prefix) => {
	const articles = await readJSONFile(config.paths.data.articles);
	const latests = articles.slice(0, 10);
	return Promise.all(latests.map(extendArticle.bind(null, prefix)));
};

const extendBook = (book) => {
	const image = `https://m.media-amazon.com/images/P/${book.asin}.jpg`;
	const link = `https://www.amazon.co.jp/exec/obidos/ASIN/${book.asin}/hail2unet-22`;
	return {
		...book,
		body: `<p><a href="${link}"><img src="${image}" title="${book.title}"></a></p>`,
		description: book.title,
		ifttt: `${book.title} ${link}`,
		link,
		type: "book",
	};
};

const readBooks = async () => {
	const books = await readJSONFile(config.paths.data.books);
	const latests = books.slice(0, 10);
	return Promise.all(latests.map(extendBook));
};

const extendDocument = (prefix, document) => ({
	...document,
	ifttt: `${document.title} ${toAbsoluteURL(prefix, document.link)}`,
	type: "document",
});

const readDocuments = async (prefix) => {
	const documents = await readJSONFile(config.paths.data.documents);
	const latests = documents.slice(0, 10);
	return Promise.all(latests.map(extendDocument.bind(null, prefix)));
};

const extendLink = (link) => ({
	...link,
	description: link.comment,
	ifttt: `${link.comment} ${link.url}`,
	link: link.url,
	type: "link",
});

const readLinks = async () => {
	const links = await readJSONFile(config.paths.data.links);
	const latests = links.slice(0, 10);
	return Promise.all(latests.map(extendLink));
};

const extendStatus = (status) => ({
	...status,
	description: status.text,
	ifttt: status.text,
	link: `/statuses/#on-${status.published}`,
	title: status.text,
	type: "status",
});

const readStatuses = async () => {
	const statuses = await readJSONFile(config.paths.data.statuses);
	const latests = statuses.slice(0, 10);
	return Promise.all(latests.map(extendStatus));
};

const pickItems = (metadata, type) => metadata[type];

const comparePublished = (a, b) =>
	Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const monthNames = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

const getDateDetails = (dt) => ({
	date: dt.getDate(),
	dow: dowNames[dt.getDay()],
	hour: String(dt.getHours()).padStart(2, "0"),
	minute: String(dt.getMinutes()).padStart(2, "0"),
	month: monthNames[dt.getMonth()],
	second: String(dt.getSeconds()).padStart(2, "0"),
	year: String(dt.getFullYear()),
});

const extendItem = (prefix, item) => {
	const dt = getDateDetails(new Date(item.published));
	return {
		...item,
		...dt,
		link: toAbsoluteURL(prefix, item.link),
	};
};

const mergeData = async (file, metadata) => {
	const overrides = await readJSONFile(file.metadata);
	return {
		...metadata,
		...overrides,
		items: file.type
			.map(pickItems.bind(null, metadata))
			.flat()
			.sort(comparePublished)
			.slice(0, 10)
			.map(extendItem.bind(null, `${metadata.scheme}://${metadata.domain}`)),
	};
};

const build = async (metadata, file) => {
	const [data, template] = await Promise.all([
		mergeData(file, metadata),
		fs.readFile(file.src, "utf8"),
	]);
	const rendered = mustache.render(template, data);
	await outputFile(file.dest, rendered);
};

const main = async () => {
	const metadata = await readJSONFile(config.paths.metadata.root);
	const prefix = `${metadata.scheme}://${metadata.domain}`;
	const [articles, books, documents, links, statuses] = await Promise.all([
		readArticles(prefix),
		readBooks(),
		readDocuments(prefix),
		readLinks(),
		readStatuses(),
	]);
	metadata.articles = articles;
	metadata.books = books;
	metadata.documents = documents;
	metadata.links = links;
	metadata.statuses = statuses;
	return Promise.all(config.files.feed.map(build.bind(null, metadata)));
};

mustache.escape = escapeCharacters;
main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
