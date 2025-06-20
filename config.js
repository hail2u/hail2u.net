import pkg from "./package.json" with { type: "json" };

export default {
  data: {
    articles: "articles.json",
    books: "books.json",
    links: "links.json",
    projects: "projects.json",
    statuses: "statuses.json",
  },
  dir: {
    data: "data/",
    dest: "dist/",
    image: "dist/img/",
    metadata: "metadata/",
    partial: "template/partials/",
    static: "static/",
    template: "template/",
  },
  domain: "hail2u.net",
  email: "hail2u@gmail.com",
  encoding: "UTF-8",
  favicon: "favicon.svg",
  feed: "feed",
  file: {
    draft: "drafts.html",
    preview: "preview.html",
    statusLog: "data/statuses/log.html",
  },
  fullname: "Kyo Nagashima",
  github: "hail2u",
  image: {
    blog: {
      height: 1440,
      width: 2560,
    },
  },
  lang: "ja",
  licenseName: "Creative Commons (表示)",
  licenseURL: "https://creativecommons.org/licenses/by/4.0/",
  name: pkg.name,
  region: "JP",
  scheme: "https",
  shimei: "ながしまきょう",
  siteTitle: "Hail2u",
  template: {
    article: "blog/_article.html.mustache",
    draft: "_draft.html.mustache",
    old: "blog/_old.html.mustache",
  },
  test: {
    articles: 3,
    timeout: 30000,
  },
  version: pkg.version,
};
