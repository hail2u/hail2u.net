export default {
	"data": {
		"article": "src/blog/article.json",
		"articles": "src/blog/articles.json",
		"books": "src/bookshelf/books.json",
		"documents": "src/documents/documents.json",
		"followings": "src/links/followings.json",
		"links": "src/links/links.json",
		"metadata": "src/metadata.json",
		"statuses": "src/statuses/statuses.json"
	},
	"dest": {
		"articleImages": "dist/img/blog/",
		"articles": "dist/blog/",
		"favicon": "dist/favicon.ico",
		"root": "dist/",
		"styleGuide": "dist/style-guide/index.html",
		"temp": "tmp/",
		"test": "tmp/__test.html"
	},
	"files": {
		"css": [
			{
				"dest": "dist/css/documents.css",
				"src": "src/css/documents.css"
			},
			{
				"dest": "dist/css/index.{{version}}.css",
				"src": "src/css/index.css"
			},
			{
				"dest": "dist/css/print.{{version}}.css",
				"src": "src/css/print.css"
			},
			{
				"dest": "dist/css/test.css",
				"src": "src/css/test.css"
			}
		],
		"feed": [
			{
				"dest": "dist/blog/feed",
				"json": "src/blog/index.json",
				"src": "src/feed.mustache",
				"type": ["article"]
			},
			{
				"dest": "dist/bookshelf/feed",
				"json": "src/bookshelf/index.json",
				"src": "src/feed.mustache",
				"type": ["book"]
			},
			{
				"dest": "dist/documents/feed",
				"json": "src/documents/index.json",
				"src": "src/feed.mustache",
				"type": ["document"]
			},
			{
				"dest": "dist/feed",
				"json": "src/index.json",
				"src": "src/feed.mustache"
			},
			{
				"dest": "dist/ifttt.xml",
				"json": "src/index.json",
				"src": "src/ifttt.mustache"
			},
			{
				"dest": "dist/links/feed",
				"json": "src/links/index.json",
				"src": "src/feed.mustache",
				"type": ["link"]
			},
			{
				"dest": "dist/statuses/feed",
				"json": "src/statuses/index.json",
				"src": "src/feed.mustache",
				"type": ["status"]
			}
		],
		"html": [
			{
				"data": "src/blog/index.json",
				"dest": "dist/blog/index.html",
				"src": "src/blog/index.mustache"
			},
			{
				"data": "src/bookshelf/index.json",
				"dest": "dist/bookshelf/index.html",
				"src": "src/bookshelf/index.mustache"
			},
			{
				"data": "src/bookshelf/index.json",
				"dest": "dist/bookshelf/log.html",
				"src": "src/bookshelf/log.mustache"
			},
			{
				"data": "src/documents/index.json",
				"dest": "dist/documents/index.html",
				"src": "src/documents/index.mustache"
			},
			{
				"data": "src/index.json",
				"dest": "dist/index.html",
				"src": "src/index.mustache"
			},
			{
				"data": "src/links/index.json",
				"dest": "dist/links/index.html",
				"src": "src/links/index.mustache"
			},
			{
				"data": "src/index.json",
				"dest": "dist/mysubscriptions.opml",
				"src": "src/mysubscriptions.mustache"
			},
			{
				"data": "src/index.json",
				"dest": "dist/sitemap.xml",
				"src": "src/sitemap.mustache"
			},
			{
				"data": "src/statuses/index.json",
				"dest": "dist/statuses/index.html",
				"src": "src/statuses/index.mustache"
			}
		],
		"icon": [
			{
				"src": "src/img/icon.svg",
				"width": 16
			},
			{
				"src": "src/img/icon.svg",
				"width": 24
			},
			{
				"src": "src/img/icon.svg",
				"width": 32
			},
			{
				"src": "src/img/icon.svg",
				"width": 48
			},
			{
				"src": "src/img/icon.svg",
				"width": 128
			},
			{
				"dest": "dist/apple-touch-icon.png",
				"src": "src/img/icon.svg",
				"width": 180
			}
		],
		"js": [
			{
				"dest": "dist/js/append-next.{{version}}.js",
				"src": "src/js/append-next.js"
			}
		]
	},
	"src": {
		"article": "src/blog/article.mustache",
		"articleImages": "src/img/blog/",
		"drafts": "src/drafts/",
		"partial": "src/partial/",
		"root": "src/",
		"styleGuide": "src/css/test.html",
		"test": "src/blog/test.mustache"
	}
};
