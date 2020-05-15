import config from "./config.js";
import {escapeCharacters, unescapeReferences} from "../lib/character-reference.js";
import fs from "fs/promises";
import getDateDetails from "../lib/get-date-details.js";
import mustache from "mustache";
import path from "path";
import {readJSONFile} from "../lib/json-file.js";

const toAbsoluteURL = (url) => {
	if (url.startsWith("/")) {
		return `https://hail2u.net${url}`;
	}

	return url;
};

const toAbsoluteURLAll = (match, attr, url) => `${attr}="${toAbsoluteURL(url)}"`;

const extendArticle = async (article) => {
	const body = await fs.readFile(path.join(config.src.root, article.link), "utf8");
	const description = unescapeReferences(body.replace(/<.*?>/g, ""))
		.trim()
		.split("\n")
		.shift();
	return {
		...article,
		"body": body.replace(/(href|src)="(\/.*?)"/g, toAbsoluteURLAll),
		"description": description,
		"type": "article"
	};
};

const readArticles = async () => {
	const articles = await readJSONFile(config.data.articles);
	return Promise.all(articles
		.slice(0, 10)
		.map(extendArticle));
};

const hasPublished = (book) => book.published;

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
	return books
		.filter(hasPublished)
		.slice(0, 10)
		.map(extendBook);
};

const extendDocument = (document) => ({
	...document,
	"type": "document"
});

const readDocuments = async () => {
	const documents = await readJSONFile(config.data.documents);
	return documents
		.slice(0, 10)
		.map(extendDocument);
};

const extendLink = (link) => ({
	...link,
	"description": link.url,
	"link": link.url,
	"type": "link"
});

const readLinks = async () => {
	const links = await readJSONFile(config.data.links);
	return links
		.slice(0, 10)
		.map(extendLink);
};

const extendPhoto = ({link, published, title = link}) => {
	const url = toAbsoluteURL(link);
	return {
		"body": `<p><a href="${url}"><img src="${url}" title="${title}"></a></p>`,
		"description": title,
		"link": link,
		"published": published,
		"title": title,
		"type": "photo"
	};
};

const readPhotos = async () => {
	const photos = await readJSONFile(config.data.photos);
	return photos.map(extendPhoto);
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
	return statuses
		.slice(0, 10)
		.map(extendStatus);
};

const compareByPublished = (a, b) =>
	Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

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
	await fs.writeFile(file.dest, rendered);
};

const main = async () => {
	const [
		metadata,
		articles,
		books,
		documents,
		links,
		photos,
		statuses
	] = await Promise.all([
		readJSONFile(config.data.metadata),
		readArticles(),
		readBooks(),
		readDocuments(),
		readLinks(),
		readPhotos(),
		readStatuses()
	]);
	metadata.items = [
		...articles,
		...books,
		...documents,
		...links,
		...photos,
		...statuses
	].sort(compareByPublished);
	return Promise.all(config.files.feed.map(buildFeed.bind(null, metadata)));
};

mustache.escape = escapeCharacters;
main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
