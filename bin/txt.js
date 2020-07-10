import {
	escapeCharacters,
	unescapeReferences
} from "../lib/character-reference.js";
import config from "./config.js";
import fs from "fs/promises";
import {
	getDateDetails
} from "../lib/get-date-details.js";
import {
	getVersion
} from "../lib/get-version.js";
import minimist from "minimist";
import mustache from "mustache";
import {
	outputFile
} from "../lib/output-file.js";
import path from "path";
import {
	readJSONFile
} from "../lib/json-file.js";

const extendArticle = async (requireBody, article, i, articles) => {
	const dt = getDateDetails(new Date(article.published));

	if (!requireBody || (typeof requireBody === "string" && !requireBody.endsWith(article.link))) {
		return {
			...article,
			...dt,
			"isArticle": true
		};
	}

	const body = await fs.readFile(path.join(config.src.root, article.link), "utf8");
	const description = unescapeReferences(body.replace(/<.*?>/g, ""))
		.trim()
		.split("\n")
		.shift();

	if (i === articles.length - 1) {
		return {
			...article,
			...dt,
			"body": body.trim(),
			"description": description,
			"isArticle": true
		};
	}

	const {
		link,
		title
	} = articles[i + 1];
	return {
		...article,
		...dt,
		"body": body.trim(),
		"description": description,
		"isArticle": true,
		"previous": {
			"link": link,
			"title": title
		}
	};
};

const readArticles = async (requireBody) => {
	const articles = await readJSONFile(config.data.articles);
	return Promise.all(articles.map(extendArticle.bind(null, requireBody)));
};

const extendBook = (book) => {
	const dt = getDateDetails(new Date(book.published));
	return {
		...book,
		...dt,
		"isBook": true
	};
};

const readBooks = async () => {
	const books = await readJSONFile(config.data.books);
	return Promise.all(books.map(extendBook));
};

const extendDocument = (document) => {
	const dt = getDateDetails(new Date(document.published));
	return {
		...document,
		...dt,
		"isDocument": true
	};
};

const readDocuments = async () => {
	const documents = await readJSONFile(config.data.documents);
	return Promise.all(documents.map(extendDocument));
};

const extendLink = (link) => {
	const dt = getDateDetails(new Date(link.published));

	return {
		...link,
		...dt,
		"isLink": true
	};
};

const readFollowings = () => readJSONFile(config.data.followings);

const readLinks = async () => {
	const links = await readJSONFile(config.data.links);
	return Promise.all(links.map(extendLink));
};

const extendPhoto = (photo) => {
	const dt = getDateDetails(new Date(photo.published));
	return {
		...photo,
		...dt,
		"isPhoto": true
	};
};

const readPhotos = async () => {
	const photos = await readJSONFile(config.data.photos);
	return Promise.all(photos.map(extendPhoto));
};

const extendStatus = (status) => {
	const dt = getDateDetails(new Date(status.published));
	return {
		...status,
		...dt,
		"isStatus": true
	};
};

const readStatuses = async () => {
	const statuses = await readJSONFile(config.data.statuses);
	return Promise.all(statuses.map(extendStatus));
};

const readPartial = async (filename) => {
	const name = path.basename(filename, ".mustache");
	const content = await fs.readFile(path.join(config.src.partial, filename), "utf8");
	return {
		[name]: content
	};
};

const gatherPartials = (partials) => Object.assign(...partials);

const readPartials = async () => {
	const filenames = await fs.readdir(config.src.partial);
	const partials = await Promise.all(filenames.map(readPartial));
	return gatherPartials(partials);
};

const hasSameLink = (dest, article) => dest.endsWith(article.link);

const findCover = (html) => {
	const image = /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/.exec(html);

	if (!image) {
		return {};
	}

	return {
		"cover": image[1],
		"twitterCard": "summary_large_image"
	};
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

const isLatest = (index) => {
	if (index === 0) {
		return true;
	}

	return false;
};

const isOldest = (current, next) => {
	if (!next) {
		return true;
	}

	return false;
};

const markItem = (item, index, items) => {
	const nextItem = items[index + 1];
	const previousItem = items[index - 1];
	return {
		...item,
		"isFirstInMonth": isFirstInMonth(item, previousItem),
		"isFirstInYear": isFirstInYear(item, previousItem),
		"isLastInMonth": isLastInMonth(item, nextItem),
		"isLastInYear": isLastInYear(item, nextItem),
		"isLatest": isLatest(index),
		"isOldest": isOldest(item, nextItem)
	};
};

const markItems = (items) => Promise.all(items.map(markItem));

const mergeData = async (extradataFile, dest, metadata) => {
	const extradata = await readJSONFile(extradataFile);

	if (extradataFile === config.data.article) {
		const article = metadata.articles.find(hasSameLink.bind(null, dest));
		const cover = findCover(article.body);
		return {
			...metadata,
			...extradata,
			...article,
			...cover,
			"canonical": article.link
		};
	}

	const [
		articles,
		books,
		documents,
		links,
		photos,
		statuses
	] = await Promise.all([
		metadata.articles,
		metadata.books,
		metadata.documents,
		metadata.links,
		metadata.photos,
		metadata.statuses
	].map(markItems));
	return {
		...metadata,
		...extradata,
		"articles": articles,
		"books": books,
		"documents": documents,
		"links": links,
		"photos": photos,
		"statuses": statuses
	};
};

const markFirstItem = (items) => {
	const firstItem = items.shift();
	firstItem.isFirstInMonth = true;
	firstItem.isFirstInYear = true;
	return [
		firstItem,
		...items
	];
};

const build = async (metadata, partials, file) => {
	const [
		data,
		template
	] = await Promise.all([
		mergeData(file.data, file.dest, metadata),
		fs.readFile(file.src, "utf8")
	]);

	if (file.dest.endsWith("/log.html")) {
		data.canonical = `${data.canonical}log.html`;
	} else {
		data.otherBooks = markFirstItem(data.books.slice(24));
		data.numOtherBooks = data.otherBooks.length;
		data.otherPhotos = markFirstItem(data.photos.slice(24));
		data.numOtherPhotos = data.otherPhotos.length;
		data.books = data.books.slice(0, 24);
		data.photos = data.photos.slice(0, 24);
	}

	if (data.isHome) {
		data.articles = data.articles.slice(0, 5);
		data.books = data.books.slice(0, 3);
		data.documents = data.documents.slice(0, 1);
		data.links = data.links.slice(0, 5);
		data.photos = data.photos.slice(0, 3);
		data.statuses = data.statuses.slice(0, 1);
	}

	const rendered = mustache.render(template, data, partials);
	await outputFile(file.dest, rendered);
};

const toFilesFormat = (article) => ({
	"data": config.data.article,
	"dest": path.join(config.dest.root, article.link),
	"src": config.src.article,
	...article
});

const main = async () => {
	const argv = minimist(process.argv.slice(2), {
		"alias": {
			"A": "articles",
			"a": "article"
		},
		"boolean": ["articles"],
		"default": {
			"article": "",
			"articles": false
		},
		"string": ["article"]
	});
	const [
		metadata,
		articles,
		books,
		documents,
		followings,
		links,
		photos,
		statuses,
		partials,
		version
	] = await Promise.all([
		readJSONFile(config.data.metadata),
		readArticles(argv.articles || argv.article),
		readBooks(),
		readDocuments(),
		readFollowings(),
		readLinks(),
		readPhotos(),
		readStatuses(),
		readPartials(),
		getVersion()
	]);
	metadata.articles = articles;
	metadata.books = books;
	metadata.documents = documents;
	metadata.followings = followings;
	metadata.links = links;
	metadata.photos = photos;
	metadata.statuses = statuses;
	metadata.version = version;

	if (argv.article) {
		return build(metadata, partials, {
			"data": config.data.article,
			"dest": argv.article,
			"src": config.src.article
		});
	}

	if (argv.articles) {
		const articleFiles = await Promise.all(articles.map(toFilesFormat));
		return Promise.all(articleFiles.map(build.bind(null, metadata, partials)));
	}

	return Promise.all(config.files.txt.map(build.bind(null, metadata, partials)));
};

mustache.escape = escapeCharacters;
main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
