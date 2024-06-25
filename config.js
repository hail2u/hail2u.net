/*
 * ESLint v9 does not support `import .. from .. with`
 * import pkg from "./package.json" with { type: "json" };
 */
import fs from "node:fs/promises";

const file = new URL("./package.json", import.meta.url);
const pkg = await fs.readFile(file, "utf8").then(JSON.parse);

export default {
  dir: {
    assets: "assets/",
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
  touchIcon: "/apple-touch-icon.png",
  twitter: "hail2u_",
  twitterCard: "summary",
  version: pkg.version,
};
