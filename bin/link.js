import { outputJSONFile, readJSONFile } from "./lib/json-file.js";
import config from "../config.js";
import { getDateDetails } from "./lib/get-date-details.js";
import { openTwitter } from "./lib/open-twitter.js";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import util from "node:util";

const main = async () => {
  const {
    values: { comment, title, url },
  } = util.parseArgs({
    options: {
      comment: {
        short: "c",
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

  if (!comment) {
    throw new Error("--comment is required.");
  }

  if (!title) {
    throw new Error("--title is required.");
  }

  if (!url) {
    throw new Error("--url is required.");
  }

  const file = path.join(config.dir.data, "links.json");
  const links = await readJSONFile(file);
  const published = Date.now();
  const dt = getDateDetails(published);
  await outputJSONFile(file, [
    {
      description: comment,
      link: url,
      published,
      ...dt,
      shortDescription: `${comment.split("。")[0]}。`,
      title,
      type: "link",
    },
    ...links,
  ]);
  await runCommand("git", ["add", "--", file]);
  await runCommand("git", ["commit", `--message=Bookmark ${url}`]);
  await openTwitter(`${comment} ${url}`);
};

main().catch((e) => {
  /* eslint-disable-next-line no-console */
  console.trace(e);
  process.exitCode = 1;
});
