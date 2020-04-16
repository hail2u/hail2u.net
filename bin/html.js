import config from "./index.js";
import convertToPOSIXPath from "../lib/convert-to-posix-path.js";
import { escapeCharacters, unescapeReferences } from "../lib/character-reference.js";
import { promises as fs } from "fs";
import getDateDetails from "../lib/get-date-details.js";
import highlight from "../lib/highlight.js";
import minimist from "minimist";
import mustache from "mustache";
import path from "path";
import { readJSONFile } from "../lib/json-file.js";
import sharp from "sharp";
import getVersion from "../lib/get-version.js";

const extendArticle = async (article, i, articles) => {
	const dt = getDateDetails(new Date(article.published));
	const body = await fs.readFile(path.join(config.src.root, article.link), "utf8");
	const description = unescapeReferences(body
		.replace(/<.*?>/g, ""))
		.trim()
		.split("\n")
		.shift();

	if (i === articles.length - 1) {
		return {
			...article,
			...dt,
			body: body,
			description: description,
			isArticle: true
		};
	}

	const { link, title } = articles[i + 1];
	return {
		...article,
		...dt,
		body: body,
		description: description,
		isArticle: true,
		previous: {
			link: link,
			title: title
		}
	};
};

const readArticles = async () => {
	const articles = await readJSONFile(config.data.articles);
	return Promise.all(articles.map(extendArticle));
};

const extendBook = book => {
	const dt = getDateDetails(new Date(book.published));
	return {
		...book,
		...dt,
		isBook: true
	};
};

const readBooks = async () => {
	const books = await readJSONFile(config.data.books);
	return books.map(extendBook);
};

const extendDocument = document => {
	const dt = getDateDetails(new Date(document.published));
	return {
		...document,
		...dt,
		isDocument: true
	};
};

const readDocuments = async () => {
	const documents = await readJSONFile(config.data.documents);
	return documents.map(extendDocument);
};

const extendLink = link => {
	const dt = getDateDetails(new Date(link.published));
	return {
		...link,
		...dt,
		isLink: true
	};
};

const readLinks = async () => {
	const links = await readJSONFile(config.data.links);
	return links.map(extendLink);
};

const isPhoto = filename => {
	if (path.extname(filename) === ".jpg") {
		return true;
	}

	return false;
};

const getPhotoDatetime = photo => {
	const dt = path.basename(photo, ".jpg").split("");
	return Date.parse(`${dt[0]}${dt[1]}${dt[2]}${dt[3]}-${dt[4]}${dt[5]}-${dt[6]}${dt[7]}T${dt[8]}${dt[9]}:${dt[10]}${dt[11]}:${dt[12]}${dt[13]}`);
};

const getPhotoDimension = async photo => {
	const metadata = await sharp(path.join(config.src.photos, photo)).metadata();
	return [metadata.height, metadata.width];
};

const extendPhoto = async photo => {
	const published = getPhotoDatetime(photo);
	const dt = getDateDetails(new Date(published));
	const [height, width] = await getPhotoDimension(photo);
	return {
		...dt,
		filename: photo,
		height: height,
		isPhoto: true,
		published: published,
		url: `/img/photos/${photo}`,
		width: width
	};
};

const listPhotos = async () => {
	const photos = await fs.readdir(config.src.photos);
	return Promise.all(photos
		.filter(isPhoto)
		.sort()
		.reverse()
		.map(extendPhoto));
};

const extendStatus = status => {
	const dt = getDateDetails(new Date(status.published));
	return {
		...status,
		...dt,
		isStatus: true
	};
};

const readStatuses = async () => {
	const statuses = await readJSONFile(config.data.statuses);
	return statuses.map(extendStatus);
};

const readPartial = async filename => {
	const name = path.basename(filename, ".mustache");
	const content = await fs.readFile(path.join(config.src.partial, filename), "utf8");
	return {
		[name]: content
	};
};

const gatherPartials = partials => Object.assign(...partials);

const readPartials = async () => {
	const filenames = await fs.readdir(config.src.partial);
	const partials = await Promise.all(filenames.map(readPartial));
	return gatherPartials(partials);
};

const hasSameLink = (dest, article) => dest.endsWith(article.link);

const findCover = (image, defaultTwitterCard, defaultCover) => {
	if (!image) {
		return [defaultTwitterCard, defaultCover];
	}

	return ["summary_large_image", image[1]];
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

const isLatest = index => {
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
		isFirstInMonth: isFirstInMonth(item, previousItem),
		isFirstInYear: isFirstInYear(item, previousItem),
		isLastInMonth: isLastInMonth(item, nextItem),
		isLastInYear: isLastInYear(item, nextItem),
		isLatest: isLatest(index),
		isOldest: isOldest(item, nextItem)
	};
};

const markItems = items => Promise.all(items.map(markItem));

const mergeData = async (extradataFile, dest, metadata) => {
	const extradata = await readJSONFile(extradataFile);

	if (extradataFile === config.data.article) {
		const article = metadata.articles.find(hasSameLink.bind(null, dest));
		const firstImage = /<img\s.*?\bsrc="(\/img\/blog\/.*?)"/.exec(article.body);
		const [
			twitterCard,
			cover
		] = findCover(firstImage, metadata.twitterCard, metadata.cover);
		return {
			...metadata,
			...extradata,
			...article,
			canonical: article.link,
			cover: cover,
			shortTitle: article.title,
			twitterCard: twitterCard
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
		articles: articles,
		books: books,
		documents: documents,
		links: links,
		photos: photos,
		statuses: statuses
	};
};

const markFirstItem = items => {
	const firstItem = items.shift();
	firstItem.isFirstInMonth = true;
	firstItem.isFirstInYear = true;
	return [
		firstItem,
		...items
	];
};

const buildHTML = async (metadata, partials, file) => {
	const [data, template] = await Promise.all([
		mergeData(file.json, file.dest, metadata),
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
		data.articles = data.articles.slice(0, 6);
		data.books = data.books.slice(0, 12);
		data.documents = data.documents.slice(0, 6);
		data.links = data.links.slice(0, 6);
		data.photos = data.photos.slice(0, 12);
		data.statuses = data.statuses.slice(0, 1);
	}

	const rendered = mustache.render(template, data, partials);
	const highlighted = highlight(rendered);
	await fs.writeFile(file.dest, highlighted);
};

const toFilesFormat = article => ({
	dest: convertToPOSIXPath(path.join(config.dest.root, article.link)),
	json: config.data.article,
	src: config.src.article,
	...article
});

const main = async () => {
	const argv = minimist(process.argv.slice(2), {
		alias: {
			A: "articles",
			a: "article"
		},
		boolean: ["articles"],
		string: ["article"]
	});
	const [
		metadata,
		articles,
		books,
		documents,
		links,
		photos,
		statuses,
		partials,
		version
	] = await Promise.all([
		readJSONFile(config.data.metadata),
		readArticles(),
		readBooks(),
		readDocuments(),
		readLinks(),
		listPhotos(),
		readStatuses(),
		readPartials(),
		getVersion()
	]);
	metadata.articles = articles;
	metadata.books = books;
	metadata.documents = documents;
	metadata.links = links;
	metadata.photos = photos;
	metadata.statuses = statuses;
	metadata.version = version;

	if (argv.article) {
		return buildHTML(metadata, partials, {
			dest: argv.article,
			json: config.data.article,
			src: config.src.article
		});
	}

	if (argv.articles) {
		const articleFiles = await Promise.all(articles.map(toFilesFormat));
		return Promise.all(articleFiles.map(buildHTML.bind(null, metadata, partials)));
	}

	return Promise.all(config.files.html.map(buildHTML.bind(null, metadata, partials)));
};

mustache.escape = escapeCharacters;
main().catch(e => {
	console.trace(e);
	process.exitCode = 1;
});
