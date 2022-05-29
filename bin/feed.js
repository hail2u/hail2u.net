import config from "../.config.js";
import { escapeCharacters } from "../lib/character-reference.js";
import fs from "node:fs/promises";
import mustache from "mustache";
import { outputFile } from "../lib/output-file.js";
import { readJSONFile } from "../lib/json-file.js";

const readLatestContents = async (file) => {
	const items = await readJSONFile(file);
	return items.slice(0, 10);
};

const pickItem = (types, item) => types.includes(item.type);

const comparePublished = (a, b) => Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

const toAbsoluteURL = (prefix, url) => {
	if (!url.startsWith("/")) {
		return url;
	}

	return `${prefix}${url}`;
};

const toAbsoluteURLAll = (prefix, match, attr, url) => {
	const absoluteURL = toAbsoluteURL(prefix, url);
	return `${attr}="${absoluteURL}"`;
};

const extendItem = (prefix, item) => {
	const link = toAbsoluteURL(prefix, item.link);

	if (item.body) {
		const urlRe = /(href|src)="(\/.*?)"/gu;
		return {
			...item,
			body: item.body.replace(urlRe, toAbsoluteURLAll.bind(null, prefix)),
			link
		};
	}

	return {
		...item,
		link
	};
};

const mergeData = async (file, data) => {
	const overrides = await readJSONFile(file.metadata);
	const prefix = `${data.scheme}://${data.domain}`;
	return {
		...data,
		...overrides,
		items: data.items.filter(pickItem.bind(null, file.types))
			.sort(comparePublished)
			.slice(0, 10)
			.map(extendItem.bind(null, prefix))
	};
};

const build = async (basic, file) => {
	const [
		data,
		template
	] = await Promise.all([
		mergeData(file, basic),
		fs.readFile(file.template, "utf8")
	]);
	const rendered = mustache.render(template, data, null, { escape: escapeCharacters });
	await outputFile(file.dest, rendered);
};

const main = async () => {
	const [
		metadata,
		articles,
		books,
		links
	] = await Promise.all([
		readJSONFile(config.metadata.root),
		readLatestContents(config.src.articles),
		readLatestContents(config.src.books),
		readLatestContents(config.src.links)
	]);
	return Promise.all(
		config.files.feed.map(
			build.bind(null, {
				...metadata,
				items: [
					...articles,
					...books,
					...links
				]
			})
		)
	);
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
