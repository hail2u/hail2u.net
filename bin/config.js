export default {
	data: {
		articles: "src/blog/articles.json",
		books: "src/bookshelf/books.json",
		documents: "src/documents/documents.json",
		followings: "src/links/followings.json",
		links: "src/links/links.json",
		statuses: "src/statuses/statuses.json",
	},
	dest: {
		articleImages: "dist/img/blog/",
		articles: "dist/blog/",
		favicon: "dist/favicon.ico",
		root: "dist/",
		styleGuide: "dist/style-guide/index.html",
		temp: "tmp/",
		test: "tmp/__test.html",
	},
	files: {
		css: [
			{
				dest: "dist/css/index.{{version}}.css",
				src: "src/css/index.css",
			},
			{
				dest: "dist/css/print.{{version}}.css",
				src: "src/css/print.css",
			},
			{
				dest: "dist/css/test.css",
				src: "src/css/test.css",
			},
		],
		feed: [
			{
				dest: "dist/blog/feed",
				metadata: "src/blog/index.json",
				src: "src/feed.mustache",
				type: ["article"],
			},
			{
				dest: "dist/bookshelf/feed",
				metadata: "src/bookshelf/index.json",
				src: "src/feed.mustache",
				type: ["book"],
			},
			{
				dest: "dist/documents/feed",
				metadata: "src/documents/index.json",
				src: "src/feed.mustache",
				type: ["document"],
			},
			{
				dest: "dist/feed",
				metadata: "src/index.json",
				src: "src/feed.mustache",
			},
			{
				dest: "dist/ifttt.xml",
				metadata: "src/index.json",
				src: "src/ifttt.mustache",
			},
			{
				dest: "dist/links/feed",
				metadata: "src/links/index.json",
				src: "src/feed.mustache",
				type: ["link"],
			},
			{
				dest: "dist/statuses/feed",
				metadata: "src/statuses/index.json",
				src: "src/feed.mustache",
				type: ["status"],
			},
		],
		html: [
			{
				dest: "dist/blog/index.html",
				metadata: "src/blog/index.json",
				src: "src/blog/index.mustache",
			},
			{
				dest: "dist/bookshelf/index.html",
				metadata: "src/bookshelf/index.json",
				src: "src/bookshelf/index.mustache",
			},
			{
				dest: "dist/bookshelf/log.html",
				metadata: "src/bookshelf/index.json",
				src: "src/bookshelf/log.mustache",
			},
			{
				dest: "dist/documents/index.html",
				metadata: "src/documents/index.json",
				src: "src/documents/index.mustache",
			},
			{
				dest: "dist/index.html",
				metadata: "src/index.json",
				src: "src/index.mustache",
			},
			{
				dest: "dist/links/index.html",
				metadata: "src/links/index.json",
				src: "src/links/index.mustache",
			},
			{
				dest: "dist/mysubscriptions.opml",
				metadata: "src/mysubscriptions.json",
				src: "src/mysubscriptions.mustache",
			},
			{
				dest: "dist/sitemap.xml",
				metadata: "src/sitemap.json",
				src: "src/sitemap.mustache",
			},
			{
				dest: "dist/statuses/index.html",
				metadata: "src/statuses/index.json",
				src: "src/statuses/index.mustache",
			},
		],
		icon: [
			{
				src: "src/img/icon.svg",
				width: 16,
			},
			{
				src: "src/img/icon.svg",
				width: 24,
			},
			{
				src: "src/img/icon.svg",
				width: 32,
			},
			{
				src: "src/img/icon.svg",
				width: 48,
			},
			{
				src: "src/img/icon.svg",
				width: 128,
			},
			{
				dest: "dist/apple-touch-icon.png",
				src: "src/img/icon.svg",
				width: 180,
			},
		],
		js: [
			{
				dest: "dist/js/append-next.{{version}}.js",
				src: "src/js/append-next.js",
			},
		],
	},
	metadata: {
		article: "src/blog/article.json",
		root: "src/metadata.json",
	},
	src: {
		article: "src/blog/article.mustache",
		articleImages: "src/img/blog/",
		drafts: "src/drafts/",
		partial: "src/partial/",
		root: "src/",
		styleGuide: "src/css/test.html",
		test: "src/blog/test.mustache",
	},
};
