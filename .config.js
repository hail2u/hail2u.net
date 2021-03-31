export default {
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
				type: ["articles"],
			},
			{
				dest: "dist/bookshelf/feed",
				metadata: "src/bookshelf/index.json",
				src: "src/feed.mustache",
				type: ["books"],
			},
			{
				dest: "dist/documents/feed",
				metadata: "src/documents/index.json",
				src: "src/feed.mustache",
				type: ["documents"],
			},
			{
				dest: "dist/feed",
				metadata: "src/index.json",
				src: "src/feed.mustache",
				type: ["articles", "books", "documents", "links", "statuses"],
			},
			{
				dest: "dist/links/feed",
				metadata: "src/links/index.json",
				src: "src/feed.mustache",
				type: ["links"],
			},
			{
				dest: "dist/statuses/feed",
				metadata: "src/statuses/index.json",
				src: "src/feed.mustache",
				type: ["statuses"],
			},
		],
		html: [
			{
				dest: "dist/about/index.html",
				metadata: "src/about/index.json",
				src: "src/about/index.mustache",
			},
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
				metadata: "src/metadata.json",
				src: "src/mysubscriptions.mustache",
			},
			{
				dest: "dist/sitemap.xml",
				metadata: "src/metadata.json",
				src: "src/sitemap.mustache",
			},
			{
				dest: "dist/statuses/index.html",
				metadata: "src/statuses/index.json",
				src: "src/statuses/index.mustache",
			},
			{
				dest: "dist/statuses/log.txt",
				metadata: "src/statuses/log.json",
				src: "src/statuses/log.mustache",
			},
			{
				dest: "dist/subscriptions/index.html",
				metadata: "src/subscriptions/index.json",
				src: "src/subscriptions/index.mustache",
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
	},
	paths: {
		data: {
			articles: "data/articles.json",
			books: "data/books.json",
			documents: "data/documents.json",
			links: "data/links.json",
			statuses: "data/statuses.json",
			subscriptions: "data/subscriptions.json",
		},
		dest: {
			article: "dist/blog/",
			favicon: "dist/favicon.ico",
			root: "dist/",
			sitemap: "dist/sitemap.xml",
			styleGuide: "dist/style-guide/index.html",
		},
		metadata: {
			article: "src/blog/article.json",
			root: "src/metadata.json",
		},
		src: {
			article: "src/blog/article.mustache",
			draft: "src/drafts/",
			partial: "src/partial/",
			root: "src/",
			styleGuide: "src/css/test.html",
			testArticle: "src/blog/test.mustache",
		},
	},
};
