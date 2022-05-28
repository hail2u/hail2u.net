export default {
	contents: {
		articles: "contents/articles.json",
		books: "contents/books.json",
		links: "contents/links.json"
	},
	dest: {
		article: "dist/blog/",
		favicon: "dist/favicon.ico",
		root: "dist/",
		sitemap: "dist/sitemap.xml",
		styleGuide: "dist/style-guide/index.html"
	},
	files: {
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
		feed: [
			{
				dest: "dist/blog/feed",
				metadata: "src/blog/index.json",
				src: "src/feed.mustache",
				types: ["article"]
			},
			{
				dest: "dist/bookshelf/feed",
				metadata: "src/bookshelf/index.json",
				src: "src/feed.mustache",
				types: ["book"]
			},
			{
				dest: "dist/feed",
				metadata: "src/index.json",
				src: "src/feed.mustache",
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
				src: "src/feed.mustache",
				types: ["link"]
			}
		],
		html: [
			{
				dest: "dist/about/index.html",
				metadata: "src/about/index.json",
				src: "src/about/index.mustache"
			},
			{
				dest: "dist/blog/index.html",
				metadata: "src/blog/index.json",
				src: "src/blog/index.mustache"
			},
			{
				dest: "dist/bookshelf/index.html",
				metadata: "src/bookshelf/index.json",
				src: "src/bookshelf/index.mustache"
			},
			{
				dest: "dist/index.html",
				metadata: "src/index.json",
				src: "src/index.mustache"
			},
			{
				dest: "dist/links/index.html",
				metadata: "src/links/index.json",
				src: "src/links/index.mustache"
			},
			{
				dest: "dist/sitemap.xml",
				metadata: "src/metadata.json",
				src: "src/sitemap.mustache"
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
		]
	},
	metadata: {
		article: "src/blog/article.json",
		root: "src/metadata.json"
	},
	src: {
		article: "src/blog/article.mustache",
		draft: "src/blog/drafts.html",
		partial: "src/partial/",
		root: "src/",
		styleGuide: "src/css/test.html",
		testArticle: "src/blog/test.mustache"
	}
};
