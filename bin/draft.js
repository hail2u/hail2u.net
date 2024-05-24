import config from "../config.js";
import fs from "node:fs/promises";
import os from "node:os";
import { outputFile } from "./lib/output-file.js";
import path from "node:path";
import { renderTemplate } from "./lib/render-template.js";
import { runCommand } from "./lib/run-command.js";
import { selectDraft } from "./lib/select-draft.js";

const main = async () => {
  const selected = await selectDraft();
  const [tempDir, template] = await Promise.all([
    fs.mkdtemp(path.join(os.tmpdir(), `${config.name}-`)),
    fs.readFile(path.join(config.dir.template, "_draft.mustache"), "utf8"),
  ]);
  const [test, rendered, toTempDir] = await Promise.all([
    path.join(tempDir, "test.html"),
    renderTemplate(template, selected),
    path.relative(tempDir, config.dir.dest),
  ]);
  const fixed = rendered.replace(
    /(?<=\b(href|src|srcset)=")(\.\/dist)?\//gu,
    `${toTempDir}/`,
  );
  await outputFile(test, fixed);
  await runCommand("open", [test]);
};

main().catch((e) => {
  /* eslint-disable-next-line no-console */
  console.trace(e);
  process.exitCode = 1;
});
