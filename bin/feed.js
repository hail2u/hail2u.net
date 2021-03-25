import config from "../.config.js";
import { escapeCharacters } from "../lib/character-reference.js";
import fs from "fs/promises";
import mustache from "mustache";
import { outputFile } from "../lib/output-file.js";
import { readJSONFile } from "../lib/json-file.js";

const readLatestItems = async (file) => {
	const items = await readJSONFile(file);
	return items.slice(0, 10);
};

const pickItems = (metadata, type) => metadata[type];

const comparePublished = (a, b) =>
	Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

const toAbsoluteURL = (prefix, url) => {
	if (!url.startsWith("/")) {
		return url;
	}

	return `${prefix}${url}`;
};

const toAbsoluteURLAll = (prefix, match, attr, url) =>
	`${attr}="${toAbsoluteURL(prefix, url)}"`;

const extendItem = (prefix, item) => {
	const link = toAbsoluteURL(prefix, item.link);

	if (item.body) {
		const urlRe = /(href|src)="(\/.*?)"/gu;
		return {
			...item,
			body: item.body.replace(urlRe, toAbsoluteURLAll.bind(null, prefix)),
			link,
		};
	}

	return {
		...item,
		link,
	};
};

const mergeData = async (file, metadata) => {
	const overrides = await readJSONFile(file.metadata);
	const prefix = `${metadata.scheme}://${metadata.domain}`;
	return {
		...metadata,
		...overrides,
		items: file.type
			.map(pickItems.bind(null, metadata))
			.flat()
			.sort(comparePublished)
			.slice(0, 10)
			.map(extendItem.bind(null, prefix)),
	};
};

const build = async (basicData, file) => {
	const [data, template] = await Promise.all([
		mergeData(file, basicData),
		fs.readFile(file.src, "utf8"),
	]);
	const rendered = mustache.render(template, data, null, {
		escape: escapeCharacters,
	});
	await outputFile(file.dest, rendered);
};

const main = async () => {
	const metadata = await readJSONFile(config.paths.metadata.root);
	const [articles, books, documents, links, statuses] = await Promise.all([
		readLatestItems(config.paths.data.articles),
		readLatestItems(config.paths.data.books),
		readLatestItems(config.paths.data.documents),
		readLatestItems(config.paths.data.links),
		readLatestItems(config.paths.data.statuses),
	]);
	return Promise.all(
		config.files.feed.map(
			build.bind(null, {
				...metadata,
				articles,
				books,
				documents,
				links,
				statuses,
			})
		)
	);
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
