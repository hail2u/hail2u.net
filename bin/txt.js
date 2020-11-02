import {
	escapeCharacters,
	unescapeReferences
} from "../lib/character-reference.js";
import config from "./config.js";
import fs from "fs/promises";
import {
	getVersion
} from "../lib/get-version.js";
import {
	highlight
} from "../lib/highlight.js";
import minimist from "minimist";
import mustache from "mustache";
import path from "path";
import {
	readJSONFile
} from "../lib/json-file.js";

const getDateDetails = (dt) => {
	const date = dt.getDate();
	const hour = dt.getHours();
	const minute = dt.getMinutes();
	const month = dt.getMonth() + 1;
	const second = dt.getSeconds();
	const year = dt.getFullYear();
	return {
		"date": date,
		"hour": hour,
		"minute": minute,
		"month": month,
		"second": second,
		"strDate": String(date).padStart(2, "0"),
		"strHour": String(hour).padStart(2, "0"),
		"strMinute": String(minute).padStart(2, "0"),
		"strMonth": String(month).padStart(2, "0"),
		"strSecond": String(second).padStart(2, "0"),
		"strYear": String(year),
		"year": year
	};
};

const extendArticle = (article, i, articles) => {
	const dt = getDateDetails(new Date(article.published));
	const description = unescapeReferences(article.body.replace(/<.*?>/g, ""))
		.trim()
		.split("\n")
		.shift();

	if (i === articles.length - 1) {
		return {
			...article,
			...dt,
			"body": article.body.trim(),
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
		"body": article.body.trim(),
		"description": description,
		"isArticle": true,
		"previous": {
			"link": link,
			"title": title
		}
	};
};

const readArticles = async () => {
	const articles = await readJSONFile(config.data.articles);
	return Promise.all(articles.map(extendArticle));
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

const readFollowings = () => readJSONFile(config.data.followings);

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

const readLinks = async () => {
	const links = await readJSONFile(config.data.links);
	return Promise.all(links.map(extendLink));
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

const isFirstInDate = (current, previous) => {
	if (!previous || current.date !== previous.date) {
		return true;
	}

	return false;
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

const isLastInDate = (current, next) => {
	if (!next || current.date !== next.date) {
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
		"isFirstInDate": isFirstInDate(item, previousItem),
		"isFirstInMonth": isFirstInMonth(item, previousItem),
		"isFirstInYear": isFirstInYear(item, previousItem),
		"isLastInDate": isLastInDate(item, nextItem),
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
		statuses
	] = await Promise.all([
		metadata.articles,
		metadata.books,
		metadata.documents,
		metadata.links,
		metadata.statuses
	].map(markItems));
	return {
		...metadata,
		...extradata,
		"articles": articles,
		"books": books,
		"documents": documents,
		"links": links,
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
		data.books = data.books.slice(0, 24);
	}

	if (data.isHome) {
		data.articles = data.articles.slice(0, 5);
		data.books = data.books.slice(0, 3);
		data.documents = data.documents.slice(0, 1);
		data.links = data.links.slice(0, 5);
		data.statuses = data.statuses.slice(0, 1);
	}

	const rendered = mustache.render(template, data, partials);
	const highlighted = highlight(rendered);
	await fs.mkdir(path.dirname(file.dest), {
		recursive: true
	});
	await fs.writeFile(file.dest, highlighted);
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
		statuses,
		partials,
		version
	] = await Promise.all([
		readJSONFile(config.data.metadata),
		readArticles(),
		readBooks(),
		readDocuments(),
		readFollowings(),
		readLinks(),
		readStatuses(),
		readPartials(),
		getVersion()
	]);
	metadata.articles = articles;
	metadata.books = books;
	metadata.documents = documents;
	metadata.followings = followings;
	metadata.links = links;
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

		while (articleFiles.length > 0) {
			await Promise.all(
				articleFiles
					.splice(-32)
					.map(build.bind(null, metadata, partials))
			);
		}
	}

	return Promise.all(config.files.txt.map(build.bind(null, metadata, partials)));
};

mustache.escape = escapeCharacters;
main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
