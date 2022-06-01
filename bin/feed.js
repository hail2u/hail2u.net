import config from "../.config.js";
import { escapeCharacters } from "../lib/character-reference.js";
import fs from "node:fs/promises";
import { globAsync } from "../lib/glob-async.js";
import { guessPath } from "../lib/guess-path.js";
import mustache from "mustache";
import { outputFile } from "../lib/output-file.js";
import path from "node:path";
import { readJSONFile } from "../lib/json-file.js";

const toFilesFormat = (template) => ({
	dest: guessPath(template, config.dest.root, "feed"),
	metadata: guessPath(template, config.src.metadata, "index.json"),
	template
});

const gatherFiles = async () => {
	const templates = await globAsync(`${config.src.templates}**/feed.mustache`);
	return Promise.all(templates.map(toFilesFormat));
};

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

const extendItem = (item) => {
	const prefix = `${config.metadata.scheme}://${config.metadata.domain}`;
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

const readData = async (filename) => {
	const name = path.basename(filename, ".json");
	const file = path.join(config.src.data, filename);
	const data = await readJSONFile(file);
	return { [ name ]: data.slice(0, 10).map(extendItem) };
};

const readLatestData = async () => {
	const filenames = await fs.readdir(config.src.data);
	const data = await Promise.all(filenames.map(readData));
	return Object.assign(...data);
};

const mergeData = async (file, data) => {
	const overrides = await readJSONFile(file.metadata);
	return {
		...data,
		...overrides
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

const comparePublished = (a, b) => Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

const main = async () => {
	const [
		files,
		{
			articles,
			books,
			links
		}
	] = await Promise.all([
		gatherFiles(),
		readLatestData()
	]);
	return Promise.all(
		files.map(
			build.bind(null, {
				...config.metadata,
				articles,
				books,
				items: [
					...articles,
					...books,
					...links
				].sort(comparePublished)
					.slice(0, 10),
				links
			})
		)
	);
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
