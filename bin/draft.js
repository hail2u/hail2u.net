import {
  formatMessage,
  validateHTML,
  writeErrors
} from "./lib/validate-html.js";
import config from "../config.js";
import { escapeCharacters } from "./lib/character-reference.js";
import fs from "node:fs/promises";
import mustache from "mustache";
import os from "node:os";
import { outputFile } from "./lib/output-file.js";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import { selectDraft } from "./lib/select-draft.js";

const validateBody = async (body, src) => {
  const messages = await validateHTML(`<!doctype html><title>_</title>${body}`);

  if (!messages) {
    return;
  }

  const errors = await Promise.all(messages.map(formatMessage.bind(null, src, 2)));
  writeErrors(errors, [ src ]);
};

const makeTempDir = async () => {
  const osTemp = await fs.realpath(os.tmpdir());
  return fs.mkdtemp(path.join(osTemp, path.sep, `${config.name}-`));
};

const main = async () => {
  const selected = await selectDraft();
  const [
    tempDir,
    template
  ] = await Promise.all([
    makeTempDir(),
    fs.readFile(path.join(config.dir.template, "_draft.mustache"), "utf8"),
    validateBody(selected.body, config.file.draft)
  ]);
  const test = path.join(tempDir, "test.html");
  const toTempDir = path.relative(tempDir, config.dir.dest);
  const rendered = mustache
    .render(template, {
      ...selected,
      body: selected.body
    }, null, { escape: escapeCharacters });
  const fixed = rendered.replace(/(?<=\b(href|src)=")(\.\/dist)?\//gu, `${toTempDir}/`);
  await outputFile(test, fixed);
  await runCommand("open", [ test ]);
};

main().catch((e) => {
  /* eslint-disable-next-line no-console */
  console.trace(e);
  process.exitCode = 1;
});
