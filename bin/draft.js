import config from "../config.js";
import { escapeCharacters } from "./lib/character-reference.js";
import fs from "node:fs/promises";
import mustache from "mustache";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import { selectDraft } from "./lib/select-draft.js";

const templateFile = path.join(config.dir.template, config.template.draft);
const previewDir = path.dirname(config.file.preview);
const [template, selected] = await Promise.all([
  fs.readFile(templateFile, "utf8"),
  selectDraft(),
  fs.mkdir(previewDir, { recursive: true }),
]);
const rendered = mustache.render(template, selected, null, {
  escape: escapeCharacters,
});
await fs.writeFile(config.file.preview, rendered);
await runCommand("open", [config.file.preview]);
