import {
	escapeCharacters,
	unescapeReferences
} from "../lib/character-reference.js";
import config from "./config.js";
import fs from "fs/promises";
import mustache from "mustache";
import path from "path";
import {
	readJSONFile
} from "../lib/json-file.js";

const toAbsoluteURL = (url) => {
	if (url.startsWith("/")) {
		return `https://hail2u.net${url}`;
	}

	return url;
};

const toAbsoluteURLAll = (match, attr, url) => `${attr}="${toAbsoluteURL(url)}"`;

const extendArticle = (article) => {
	const description = unescapeReferences(article.body.replace(/<.*?>/gu, ""))
		.trim()
		.split("\n")
		.shift();
	return {
		...article,
		"body": article.body.replace(/(href|src)="(\/.*?)"/gu, toAbsoluteURLAll),
		description,
		"type": "article",
		"ifttt": `${article.title} ${toAbsoluteURL(article.link)}`
	};
};

const readArticles = async () => {
	const articles = await readJSONFile(config.data.articles);
	const latests = articles.slice(0, 10);
	return Promise.all(latests.map(extendArticle));
};

const extendBook = (book) => {
	const image = `https://m.media-amazon.com/images/P/${book.asin}.jpg`;
	const link = `https://www.amazon.co.jp/exec/obidos/ASIN/${book.asin}/hail2unet-22`;
	return {
		...book,
		"body": `<p><a href="${link}"><img src="${image}" title="${book.title}"></a></p>`,
		"description": book.title,
		link,
		"type": "book",
		"ifttt": `${book.title} ${link}`
	};
};

const readBooks = async () => {
	const books = await readJSONFile(config.data.books);
	const latests = books.slice(0, 10);
	return Promise.all(latests.map(extendBook));
};

const extendDocument = (document) => ({
	...document,
	"type": "document"
});

const readDocuments = async () => {
	const documents = await readJSONFile(config.data.documents);
	const latests = documents.slice(0, 10);
	return Promise.all(latests.map(extendDocument));
};

const extendLink = (link) => ({
	...link,
	"description": link.comment,
	"link": link.url,
	"type": "link",
	"ifttt": `${link.comment} ${link.url}`
});

const readLinks = async () => {
	const links = await readJSONFile(config.data.links);
	const latests = links.slice(0, 10);
	return Promise.all(latests.map(extendLink));
};

const extendStatus = (status) => ({
	...status,
	"description": status.text,
	"link": `/statuses/#on-${status.published}`,
	"title": status.text,
	"type": "status",
	"ifttt": status.text
});

const readStatuses = async () => {
	const statuses = await readJSONFile(config.data.statuses);
	const latests = statuses.slice(0, 10);
	return Promise.all(latests.map(extendStatus));
};

const comparePublished = (a, b) => Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

const isValidType = (type, item) => {
	if (!type) {
		return true;
	}

	if (type.includes(item.type)) {
		return true;
	}

	return false;
};

const dowNames = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat"
];

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
	"Dec"
];

const extendDate = (dt) => [
	dt.getDate(),
	dowNames[dt.getDay()],
	String(dt.getHours()).padStart(2, "0"),
	String(dt.getMinutes()).padStart(2, "0"),
	monthNames[dt.getMonth()],
	String(dt.getSeconds()).padStart(2, "0"),
	String(dt.getFullYear())
];

const extendItem = (item) => {
	const [
		date,
		dow,
		hour,
		minute,
		month,
		second,
		year
	] = extendDate(new Date(item.published));
	return {
		...item,
		"pubDate": `${dow}, ${date} ${month} ${year} ${hour}:${minute}:${second} +0900`,
		"link": toAbsoluteURL(item.link)
	};
};

const mergeData = async (extradataFile, metadata, type) => {
	const extradata = await readJSONFile(extradataFile);
	return {
		...metadata,
		...extradata,
		"items": metadata.items
			.filter(isValidType.bind(null, type))
			.slice(0, 10)
			.map(extendItem)
	};
};

const buildFeed = async (metadata, file) => {
	const [
		data,
		template
	] = await Promise.all([
		mergeData(file.json, metadata, file.type),
		fs.readFile(file.src, "utf8")
	]);
	const rendered = mustache.render(template, data);
	await fs.mkdir(path.dirname(file.dest), {
		recursive: true
	});
	await fs.writeFile(file.dest, rendered);
};

const main = async () => {
	const [
		metadata,
		articles,
		books,
		documents,
		links,
		statuses
	] = await Promise.all([
		readJSONFile(config.data.metadata),
		readArticles(),
		readBooks(),
		readDocuments(),
		readLinks(),
		readStatuses()
	]);
	metadata.items = [
		...articles,
		...books,
		...documents,
		...links,
		...statuses
	].sort(comparePublished);
	return Promise.all(config.files.feed.map(buildFeed.bind(null, metadata)));
};

mustache.escape = escapeCharacters;
main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
