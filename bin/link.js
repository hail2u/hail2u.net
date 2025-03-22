import config from "../config.js";
import fs from "node:fs/promises";
import { getDateDetails } from "./lib/get-date-details.js";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import util from "node:util";

const {
  values: { comment, title, url },
} = util.parseArgs({
  options: {
    comment: {
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

if (!comment) {
  throw new Error("--comment is required.");
}

if (!title) {
  throw new Error("--title is required.");
}

if (!url) {
  throw new Error("--url is required.");
}

const file = path.join(config.dir.data, config.data.links);
const links = await fs.readFile(file).then(JSON.parse);
const published = Date.now();
const dt = getDateDetails(published);
const formatted = JSON.stringify(
  [
    {
      description: comment,
      link: url,
      published,
      ...dt,
      shortDescription: `${comment.split("。").at(0)}。`,
      title,
      type: "link",
    },
    ...links,
  ],
  null,
  2,
);
await fs.mkdir(path.dirname(file), {
  recursive: true,
});
await fs.writeFile(file, `${formatted}\n`);
await runCommand("git", ["add", "--", file]);
await runCommand("git", ["commit", `--message=Bookmark ${url}`]);
const twitter = new URL("https://x.com/intent/tweet");
twitter.searchParams.append("text", `${comment} / ${title} ${url}`);
await runCommand("chrome", [twitter.href]);
