export default {
	css: [
		{
			dest: "dist/css/index.{{version}}.css",
			prefix: "@supports (--custom-property: true) {",
			suffix: "}",
			src: "src/css/index.css"
		},
		{
			dest: "dist/css/print.{{version}}.css",
			src: "src/css/print.css"
		},
		{
			dest: "dist/css/test.css",
			src: "src/css/test.css"
		}
	],
	data: {
		articles: "src/blog/articles.json",
		books: "src/bookshelf/books.json",
		links: "src/links/links.json",
		statuses: "src/statuses/statuses.json",
		subscriptions: "src/subscriptions/subscriptions.json"
	},
	dest: {
		article: "dist/blog/",
		favicon: "dist/favicon.ico",
		root: "dist/",
		sitemap: "dist/sitemap.xml",
		styleGuide: "dist/style-guide/index.html"
	},
	feed: [
		{
			dest: "dist/blog/feed",
			metadata: "src/blog/index.json",
			template: "src/feed.mustache",
			types: ["article"]
		},
		{
			dest: "dist/bookshelf/feed",
			metadata: "src/bookshelf/index.json",
			template: "src/feed.mustache",
			types: ["book"]
		},
		{
			dest: "dist/feed",
			metadata: "src/index.json",
			template: "src/feed.mustache",
			types: [
				"article",
				"book",
				"document",
				"link"
			]
		},
		{
			dest: "dist/links/feed",
			metadata: "src/links/index.json",
			template: "src/feed.mustache",
			types: ["link"]
		}
	],
	html: [
		{
			dest: "dist/about/index.html",
			metadata: "src/about/index.json",
			template: "src/about/index.mustache"
		},
		{
			dest: "dist/blog/index.html",
			metadata: "src/blog/index.json",
			template: "src/blog/index.mustache"
		},
		{
			dest: "dist/bookshelf/index.html",
			metadata: "src/bookshelf/index.json",
			template: "src/bookshelf/index.mustache"
		},
		{
			dest: "dist/index.html",
			metadata: "src/index.json",
			template: "src/index.mustache"
		},
		{
			dest: "dist/links/index.html",
			metadata: "src/links/index.json",
			template: "src/links/index.mustache"
		},
		{
			dest: "dist/mysubscriptions.opml",
			metadata: "src/metadata.json",
			template: "src/mysubscriptions.mustache",
		},
		{
			dest: "dist/sitemap.xml",
			metadata: "src/metadata.json",
			template: "src/sitemap.mustache"
		},
		{
			dest: "dist/statuses/index.html",
			metadata: "src/statuses/index.json",
			template: "src/statuses/index.mustache"
		},
		{
			dest: "dist/subscriptions/index.html",
			metadata: "src/subscriptions/index.json",
			template: "src/subscriptions/index.mustache"
		}
	],
	img: [
		{
			src: "src/img/icon.svg",
			width: 16
		},
		{
			src: "src/img/icon.svg",
			width: 24
		},
		{
			src: "src/img/icon.svg",
			width: 32
		},
		{
			src: "src/img/icon.svg",
			width: 48
		},
		{
			src: "src/img/icon.svg",
			width: 128
		},
		{
			dest: "dist/apple-touch-icon.png",
			src: "src/img/icon.svg",
			width: 180
		}
	],
	metadata: {
		article: "src/blog/article.json",
		root: "src/metadata.json"
	},
	src: {
		draft: "src/blog/drafts.html",
		partial: "src/partial/",
		root: "src/",
		styleGuide: "src/css/test.html"
	},
	template: {
		article: "src/blog/article.mustache",
		testArticle: "src/blog/test.mustache"
	}
};
