export default {
	css: [
		{
			dest: "dist/css/index.{{version}}.css",
			prefix: "@supports (--custom-property: true) {",
			suffix: "}",
			src: "assets/css/index.css"
		},
		{
			dest: "dist/css/print.{{version}}.css",
			src: "assets/css/print.css"
		},
		{
			dest: "dist/css/test.css",
			src: "assets/css/test.css"
		}
	],
	dest: {
		article: "dist/blog/",
		root: "dist/",
		sitemap: "dist/sitemap.xml",
		styleGuide: "dist/style-guide/index.html"
	},
	feed: [
		{
			dest: "dist/blog/feed",
			metadata: "metadata/blog/index.json",
			template: "templates/feed.mustache",
			types: ["article"]
		},
		{
			dest: "dist/bookshelf/feed",
			metadata: "metadata/bookshelf/index.json",
			template: "templates/feed.mustache",
			types: ["book"]
		},
		{
			dest: "dist/feed",
			metadata: "metadata/index.json",
			template: "templates/feed.mustache",
			types: [
				"article",
				"book",
				"document",
				"link"
			]
		},
		{
			dest: "dist/links/feed",
			metadata: "metadata/links/index.json",
			template: "templates/feed.mustache",
			types: ["link"]
		}
	],
	html: [
		{
			dest: "dist/about/index.html",
			metadata: "metadata/about/index.json",
			template: "templates/about/index.mustache"
		},
		{
			dest: "dist/blog/index.html",
			metadata: "metadata/blog/index.json",
			template: "templates/blog/index.mustache"
		},
		{
			dest: "dist/bookshelf/index.html",
			metadata: "metadata/bookshelf/index.json",
			template: "templates/bookshelf/index.mustache"
		},
		{
			dest: "dist/index.html",
			metadata: "metadata/index.json",
			template: "templates/index.mustache"
		},
		{
			dest: "dist/links/index.html",
			metadata: "metadata/links/index.json",
			template: "templates/links/index.mustache"
		},
		{
			dest: "dist/mysubscriptions.opml",
			metadata: "metadata/mysubscriptions.json",
			template: "templates/mysubscriptions.mustache",
		},
		{
			dest: "dist/sitemap.xml",
			metadata: "metadata/sitemap.json",
			template: "templates/sitemap.mustache"
		},
		{
			dest: "dist/statuses/index.html",
			metadata: "metadata/statuses/index.json",
			template: "templates/statuses/index.mustache"
		},
		{
			dest: "dist/subscriptions/index.html",
			metadata: "metadata/subscriptions/index.json",
			template: "templates/subscriptions/index.mustache"
		}
	],
	img: [
		{
			dest: "dist/favicon.ico",
			src: "assets/img/icon.svg",
		},
		{
			dest: "dist/apple-touch-icon.png",
			src: "assets/img/icon.svg",
			width: 180
		}
	],
	metadata: {
		domain: "hail2u.net",
		email: "hail2u@gmail.com",
		encoding: "UTF-8",
		favicon: "/favicon.svg",
		feed: "/feed",
		fullname: "Kyo Nagashima",
		github: "hail2u",
		lang: "ja",
		licenseName: "クリエイティブ・コモンズ・表示ライセンス",
		licenseURL: "https://creativecommons.org/licenses/by/4.0/",
		region: "JP",
		scheme: "https",
		schemaType: "WebPage",
		shimei: "ながしまきょう",
		siteTitle: "Hail2u",
		touchIcon: "/apple-touch-icon.png",
		twitter: "hail2u_",
		twitterCard: "summary"
	},
	src: {
		data: "data/",
		draft: "drafts.html",
		metadata: "metadata/",
		styleGuide: "assets/css/test.html",
		templates: "templates/"
	}
};
