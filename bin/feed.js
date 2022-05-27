import config from "../.config.js";
import { escapeCharacters } from "../lib/character-reference.js";
import fs from "node:fs/promises";
import mustache from "mustache";
import { outputFile } from "../lib/output-file.js";
import { readJSONFile } from "../lib/json-file.js";

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

const pickItems = (types, prefix, items) => {
	const picked = [];
	let i = 0;

	for (const item of items) {
		if (!types.includes(item.type)) {
			continue;
		}

		picked.push(item);
		i += 1;

		if (i === 10) {
			break;
		}
	}

	return picked.map(extendItem.bind(null, prefix));
};

const mergeData = async (file, data) => {
	const overrides = await readJSONFile(file.metadata);
	const prefix = `${data.scheme}://${data.domain}`;
	const items = pickItems(file.types, prefix, data.items);
	return {
		...data,
		...overrides,
		items
	};
};

const build = async (basic, file) => {
	const [
		data,
		template
	] = await Promise.all([
		mergeData(file, basic),
		fs.readFile(file.src, "utf8")
	]);
	const rendered = mustache.render(template, data, null, { escape: escapeCharacters });
	await outputFile(file.dest, rendered);
};

const main = async () => {
	const [
		metadata,
		data
	] = await Promise.all([
		readJSONFile(config.paths.metadata.root),
		readJSONFile(config.paths.data)
	]);
	return Promise.all(
		config.files.feed.map(
			build.bind(null, {
				...metadata,
				items: data
			})
		)
	);
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
