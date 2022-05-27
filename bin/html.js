import config from "../.config.js";
import { escapeCharacters } from "../lib/character-reference.js";
import fs from "node:fs/promises";
import minimist from "minimist";
import mustache from "mustache";
import { outputFile } from "../lib/output-file.js";
import path from "node:path";
import { readJSONFile } from "../lib/json-file.js";

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

const toFilesFormat = (article) => ({
	dest: path.join(config.paths.dest.root, article.link),
	metadata: config.paths.metadata.article,
	src: config.paths.src.article,
	...article
});

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

const pickItem = (types, item) => {
	if (!types) {
		return true;
	}

	return types.includes(item.type);
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
		isFirstInMonth: isFirstInMonth(item, previousItem),
		isFirstInYear: isFirstInYear(item, previousItem),
		isLastInMonth: isLastInMonth(item, nextItem),
		isLastInYear: isLastInYear(item, nextItem)
	};
};

const mergeData = async (file, data) => {
	const overrides = await readJSONFile(file.metadata);

	if (overrides.isArticle) {
		const article = data.items.find(hasSameLink.bind(null, file.dest));
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
		...overrides,
		items: data.items
			.filter(pickItem.bind(null, file.types))
			.map(markItem)
	};
};

const markFirstItem = (items) => {
	const cloned = JSON.parse(JSON.stringify(items));
	const firstItem = cloned.shift();
	firstItem.isFirstInDate = true;
	firstItem.isFirstInMonth = true;
	firstItem.isFirstInYear = true;
	return [
		firstItem,
		...cloned
	];
};

const pickItems = (type, length, items) => {
	const picked = [];
	let i = 0;

	for (const item of items) {
		if (item.type !== type) {
			continue;
		}

		picked.push(item);
		i += 1;

		if (i === length) {
			break;
		}
	}

	return picked;
};

const build = async (basic, partials, file) => {
	const [
		data,
		template
	] = await Promise.all([
		mergeData(file, basic),
		fs.readFile(file.src, "utf8")
	]);

	if (!data.isArticle && (data.isBlog || data.isBookshelf || data.isLinks)) {
		data.latestItems = data.items.slice(0, 9);
		data.items = markFirstItem(data.items.slice(9));
	}

	if (data.isHome) {
		data.articles = pickItems("article", 6, data.items);
		data.books = pickItems("book", 3, data.items);
		data.links = pickItems("link", 6, data.items);
	}

	const rendered = mustache.render(template, data, partials, { escape: escapeCharacters });
	await outputFile(file.dest, rendered);
};

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
		data,
		partials,
		{ version }
	] = await Promise.all([
		readJSONFile(config.paths.metadata.root),
		readJSONFile(config.paths.data),
		readPartials(),
		readJSONFile(file)
	]);
	const extended = {
		...metadata,
		items: data,
		version
	};

	if (latest) {
		const latestData = toFilesFormat(data[0]);
		await build(extended, partials, latestData);
	}

	if (all) {
		const articles = data.filter(pickItem.bind(null, ["article", "document"]));
		const articleFiles = await Promise.all(articles.map(toFilesFormat));

		while (articleFiles.length > 0) {
			/* eslint-disable-next-line no-await-in-loop */
			await Promise.all(articleFiles
				.splice(-1024)
				.map(build.bind(null, extended, partials))
			);
		}
	}

	await Promise.all(config.files.html.map(build.bind(null, extended, partials)));
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
