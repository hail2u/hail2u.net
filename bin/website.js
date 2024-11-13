import config from "../config.js";
import fs from "node:fs/promises";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import util from "node:util";

process.on("unhandledRejection", (e) => {
  throw e;
});

const isSubscribed = (url, subscription) => url === subscription.url;

const {
  values: { author, feed, title, url },
} = util.parseArgs({
  options: {
    author: {
      type: "string",
    },
    feed: {
      type: "string",
    },
    title: {
      type: "string",
    },
    url: {
      type: "string",
    },
  },
});

if (!author) {
  throw new Error("--author is required.");
}

if (!feed) {
  throw new Error("--feed is required.");
}

if (!title) {
  throw new Error("--title is required.");
}

if (!url) {
  throw new Error("--url is required.");
}

const file = path.join(config.dir.data, "websites.json");
const websites = await fs.readFile(file).then(JSON.parse);

if (websites.find(isSubscribed.bind(null, url))) {
  throw new Error(`${title} has already been subscribed.`);
}

const formatted = JSON.stringify(
  [
    {
      author,
      feed,
      link: url,
      title,
    },
    ...websites,
  ],
  null,
  2,
);
await fs.mkdir(path.dirname(file), { recursive: true });
await fs.writeFile(file, `${formatted}\n`);
await runCommand("git", ["add", "--", file]);
await runCommand("git", ["commit", `--message=Subscribe ${url}`]);
