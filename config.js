import pkg from "./package.json" with { type: "json" };

export default {
  dir: {
    data: "data/",
    dest: "dist/",
    metadata: "metadata/",
    static: "static/",
    template: "templates/",
  },
  domain: "hail2u.net",
  email: "hail2u@gmail.com",
  encoding: "UTF-8",
  favicon: "/favicon.svg",
  feed: "/feed",
  file: {
    draft: "drafts.html",
    icon: "static/favicon.svg",
    preview: "preview.html",
  },
  fullname: "Kyo Nagashima",
  github: "hail2u",
  lang: "ja",
  licenseName: "Creative Commons (表示)",
  licenseURL: "https://creativecommons.org/licenses/by/4.0/",
  name: pkg.name,
  region: "JP",
  schemaType: "WebPage",
  scheme: "https",
  shimei: "ながしまきょう",
  siteTitle: "Hail2u",
  twitter: "hail2u_",
  version: pkg.version,
};
