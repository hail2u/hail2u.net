import config from "../config.js";
import { fs } from "node:fs/promises";
import { getDateDetails } from "./lib/get-date-details.js";
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
  const statuses = await fs.readFile(file).then(JSON.parse);
  const published = Date.now();
  const dt = getDateDetails(published);
  const formatted = JSON.stringify(
    [
      {
        description: text,
        link: `/statuses/#${published}`,
        published,
        ...dt,
        title: text,
        type: "status",
      },
      ...statuses,
    ],
    null,
    2,
  );
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${formatted}\n`);
  await runCommand("git", ["add", "--", file]);
  await runCommand("git", [
    "commit",
    "--message=Update status",
    `--message=${text}`,
  ]);
  const twitter = new URL("https://x.com/intent/tweet");
  twitter.searchParams.append("text", text);
  await runCommand("open", [twitter.href]);
};

main().catch((e) => {
  throw e;
});
