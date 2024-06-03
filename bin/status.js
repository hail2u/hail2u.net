import { outputJSONFile, readJSONFile } from "./lib/json-file.js";
import config from "../config.js";
import { getDateDetails } from "./lib/get-date-details.js";
import { openTwitter } from "./lib/open-twitter.js";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import util from "node:util";

const main = async () => {
  const {
    positionals: [text],
  } = util.parseArgs({ allowPositionals: true });

  if (!text) {
    throw new Error("Only 1 argument is required.");
  }

  const file = path.join(config.dir.data, "statuses.json");
  const statuses = await readJSONFile(file);
  const published = Date.now();
  const dt = getDateDetails(published);
  await outputJSONFile(file, [
    {
      description: text,
      link: `/statuses/#${published}`,
      published,
      ...dt,
      title: text,
      type: "status",
    },
    ...statuses,
  ]);
  await runCommand("git", ["add", "--", file]);
  await runCommand("git", [
    "commit",
    "--message=Update status",
    `--message=${text}`,
  ]);
  await openTwitter(text);
};

main().catch((e) => {
  throw e;
});
