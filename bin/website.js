import config from "../config.js";
import { fs } from "node:fs/promises";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import { shuffleArray } from "./lib/shuffle-array.js";
import util from "node:util";

const isSubscribed = (url, subscription) => url === subscription.url;

const main = async () => {
  const {
    values: { author, feed, title, url },
  } = util.parseArgs({
    options: {
      author: {
        short: "a",
        type: "string",
      },
      feed: {
        short: "f",
        type: "string",
      },
      title: {
        short: "t",
        type: "string",
      },
      url: {
        short: "u",
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

  const shuffled = shuffleArray([
    {
      author,
      feed,
      link: url,
      title,
    },
    ...websites,
  ]);
  const formatted = JSON.stringify(shuffled, null, 2);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${formatted}\n`);
  await runCommand("git", ["add", "--", file]);
  await runCommand("git", ["commit", `--message=Subscribe ${url}`]);
  const twitter = new URL("https://x.com/intent/tweet");
  twitter.searchParams.append("text", `${author} の ${title} を購読 ${url}`);
  await runCommand("open", [twitter.href]);
};

main().catch((e) => {
  throw e;
});
