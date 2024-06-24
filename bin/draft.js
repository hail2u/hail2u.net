import config from "../config.js";
import { escapeCharacters } from "./lib/character-reference.js";
import fs from "node:fs/promises";
import mustache from "mustache";
import os from "node:os";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import { selectDraft } from "./lib/select-draft.js";

const main = async () => {
  const selected = await selectDraft();
  const [tempDir, template] = await Promise.all([
    fs.mkdtemp(path.join(os.tmpdir(), `${config.name}-`)),
    fs.readFile(path.join(config.dir.template, "_draft.mustache"), "utf8"),
  ]);
  const [file, rendered, toTempDir] = await Promise.all([
    path.join(tempDir, "test.html"),
    mustache.render(template, selected, null, { escape: escapeCharacters }),
    path.relative(tempDir, config.dir.dest),
  ]);
  const fixed = rendered.replace(
    /(?<=\b(href|src|srcset)=")(\.\/dist)?\//gu,
    `${toTempDir}/`,
  );
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, fixed);
  await runCommand("open", [file]);
};

main().catch((e) => {
  throw e;
});
