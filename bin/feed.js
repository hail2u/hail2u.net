import {
	escapeCharacters,
	unescapeReferences
} from "../lib/character-reference.js";
import config from "./config.js";
import fs from "fs/promises";
import {
	getDateDetails
} from "../lib/get-date-details.js";
import mustache from "mustache";
import {
	outputFile
} from "../lib/output-file.js";
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
	const description = unescapeReferences(article.body.replace(/<.*?>/g, ""))
		.trim()
		.split("\n")
		.shift();
	return {
		...article,
		"body": article.body.replace(/(href|src)="(\/.*?)"/g, toAbsoluteURLAll),
		"description": description,
		"type": "article"
	};
};

const readArticles = async () => {
	const articles = await readJSONFile(config.data.articles);
	const latests = articles.slice(0, 10);
	return Promise.all(latests.map(extendArticle));
};

const extendBook = (book) => {
	const image = `https://images-fe.ssl-images-amazon.com/images/P/${book.asin}.jpg`;
	const link = `https://www.amazon.co.jp/exec/obidos/ASIN/${book.asin}/hail2unet-22`;
	return {
		...book,
		"body": `<p><a href="${link}"><img src="${image}" title="${book.title}"></a></p>`,
		"description": book.title,
		"link": link,
		"type": "book"
	};
};

const readBooks = async () => {
	const books = await readJSONFile(config.data.books);
	const latests = books.slice(0, 10);
	return Promise.all(latests.map(extendBook));
};

const extendLink = (link) => ({
	...link,
	"description": link.comment,
	"link": link.url,
	"type": "link"
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
	"type": "status"
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

const extendItem = (item) => {
	const dt = getDateDetails(new Date(item.published));
	return {
		...item,
		...dt,
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
	await outputFile(file.dest, rendered);
};

const main = async () => {
	const [
		metadata,
		articles,
		books,
		links,
		statuses
	] = await Promise.all([
		readJSONFile(config.data.metadata),
		readArticles(),
		readBooks(),
		readLinks(),
		readStatuses()
	]);
	metadata.items = [
		...articles,
		...books,
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
