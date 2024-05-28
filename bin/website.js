import { outputJSONFile, readJSONFile } from "./lib/json-file.js";
import config from "../config.js";
import { openTwitter } from "./lib/open-twitter.js";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import { shuffleArray } from "./lib/shuffle-array.js";
import util from "node:util";

const isSubscribed = (url, subscription) => url === subscription.url;

const main = async () => {
  const {
    values: { feed, title, url },
  } = util.parseArgs({
    options: {
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
  const websites = await readJSONFile(file);

  if (websites.find(isSubscribed.bind(null, url))) {
    throw new Error(`${title} has already been subscribed.`);
  }

  const shuffled = shuffleArray([
    {
      feed,
      link: url,
      title,
    },
    ...websites,
  ]);
  await outputJSONFile(file, shuffled);
  await runCommand("git", ["add", "--", file]);
  await runCommand("git", ["commit", `--message=Subscribe ${url}`]);
  await openTwitter(`${title} のウェブログを購読 ${url}`);
};

main().catch((e) => {
  /* eslint-disable-next-line no-console */
  console.trace(e);
  process.exitCode = 1;
});
