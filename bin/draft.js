import config from "../config.js";
import { escapeCharacters } from "./lib/character-reference.js";
import fs from "node:fs/promises";
import mustache from "mustache";
import path from "node:path";
import { runCommand } from "./lib/run-command.js";
import { selectDraft } from "./lib/select-draft.js";

const file = path.join(config.dir.template, config.template.draft);
const template = await fs.readFile(file, "utf8");
const selected = await selectDraft();
const rendered = mustache.render(template, selected, null, {
  escape: escapeCharacters,
});
await fs.mkdir(path.dirname(config.file.preview), {
  recursive: true,
});
await fs.writeFile(config.file.preview, rendered);
await runCommand("open", [config.file.preview]);
