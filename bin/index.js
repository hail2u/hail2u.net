export default {
	data: {
		article: "src/blog/article.json",
		articles: "src/blog/articles.json",
		books: "src/bookshelf/books.json",
		documents: "src/documents/documents.json",
		followings: "src/links/followings.json",
		links: "src/links/links.json",
		metadata: "src/metadata.json",
		statuses: "src/statuses/statuses.json"
	},
	dest: {
		articleImages: "dist/img/blog/",
		articles: "dist/blog/",
		favicon: "dist/favicon.ico",
		photos: "dist/img/photos/",
		root: "dist/",
		styleGuide: "dist/style-guide/index.html",
		temp: "tmp/",
		test: "tmp/__test.html"
	},
	files: {
		css: [
			{
				dest: "dist/css/documents.css",
				src: "src/css/documents.css"
			},
			{
				dest: "dist/css/main.{{version}}.css",
				src: "src/css/main.css"
			},
			{
				dest: "dist/css/test.css",
				src: "src/css/test.css"
			}
		],
		feed: [
			{
				dest: "dist/bookshelf/feed",
				json: "src/bookshelf/index.json",
				src: "src/feed.mustache",
				type: [
					"book"
				]
			},
			{
				dest: "dist/blog/feed",
				json: "src/blog/index.json",
				src: "src/feed.mustache",
				type: [
					"article"
				]
			},
			{
				dest: "dist/documents/feed",
				json: "src/documents/index.json",
				src: "src/feed.mustache",
				type: [
					"document"
				]
			},
			{
				dest: "dist/feed",
				json: "src/index.json",
				src: "src/feed.mustache"
			},
			{
				dest: "dist/links/feed",
				json: "src/links/index.json",
				src: "src/feed.mustache",
				type: [
					"link"
				]
			},
			{
				dest: "dist/photos/feed",
				json: "src/photos/index.json",
				src: "src/feed.mustache",
				type: [
					"photo"
				]
			},
			{
				dest: "dist/statuses/feed",
				json: "src/statuses/index.json",
				src: "src/feed.mustache",
				type: [
					"status"
				]
			}
		],
		html: [
			{
				dest: "dist/bookshelf/log.html",
				json: "src/bookshelf/index.json",
				src: "src/bookshelf/log.mustache"
			},
			{
				dest: "dist/bookshelf/index.html",
				json: "src/bookshelf/index.json",
				src: "src/bookshelf/index.mustache"
			},
			{
				dest: "dist/blog/index.html",
				json: "src/blog/index.json",
				src: "src/blog/index.mustache"
			},
			{
				dest: "dist/documents/index.html",
				json: "src/documents/index.json",
				src: "src/documents/index.mustache"
			},
			{
				dest: "dist/index.html",
				json: "src/index.json",
				src: "src/index.mustache"
			},
			{
				dest: "dist/links/index.html",
				json: "src/links/index.json",
				src: "src/links/index.mustache"
			},
			{
				dest: "dist/mysubscriptions.opml",
				json: "src/mysubscriptions.json",
				src: "src/mysubscriptions.mustache"
			},
			{
				dest: "dist/photos/log.html",
				json: "src/photos/index.json",
				src: "src/photos/log.mustache"
			},
			{
				dest: "dist/photos/index.html",
				json: "src/photos/index.json",
				src: "src/photos/index.mustache"
			},
			{
				dest: "dist/sitemap.xml",
				json: "src/sitemap.json",
				src: "src/sitemap.mustache"
			},
			{
				dest: "dist/statuses/index.html",
				json: "src/statuses/index.json",
				src: "src/statuses/index.mustache"
			}
		],
		icon: [
			{
				dest: "tmp/favicon-16.png",
				src: "src/img/icon-small.svg",
				width: 16
			},
			{
				dest: "tmp/favicon-24.png",
				src: "src/img/icon-small.svg",
				width: 24
			},
			{
				dest: "tmp/favicon-32.png",
				src: "src/img/icon-small.svg",
				width: 32
			},
			{
				dest: "tmp/favicon-48.png",
				src: "src/img/icon.svg",
				width: 48
			},
			{
				dest: "tmp/favicon-128.png",
				src: "src/img/icon.svg",
				width: 128
			},
			{
				dest: "dist/apple-touch-icon-precomposed.png",
				src: "src/img/icon.svg",
				width: 180
			}
		],
		js: [
			{
				dest: "dist/js/append-next.{{version}}.js",
				src: "src/js/append-next.js"
			},
			{
				dest: "dist/js/back-to-top.{{version}}.js",
				src: "src/js/back-to-top.js"
			},
			{
				dest: "dist/js/random-link.{{version}}.js",
				src: "src/js/random-link.js"
			},
			{
				dest: "dist/js/relative-time.{{version}}.js",
				src: "src/js/relative-time.js"
			},
			{
				dest: "dist/js/site-search.{{version}}.js",
				src: "src/js/site-search.js"
			},
			{
				dest: "dist/js/unutm.{{version}}.js",
				src: "src/js/unutm.js"
			}
		]
	},
	src: {
		article: "src/blog/article.mustache",
		articleImages: "src/img/blog/",
		articles: "src/blog/",
		drafts: "src/drafts/",
		partial: "src/partial/",
		photos: "src/img/photos/",
		root: "src/",
		styleGuide: "src/css/test.html",
		test: "src/blog/test.mustache"
	}
};
