import config from "../../config.js";
import { escapeCharacters } from "./lib/character-reference.js";
import fs from "node:fs/promises";
import { outputFile } from "./lib/output-file.js";
import readline from "node:readline/promises";
import { unescapeReferences } from "./character-reference.js";

const toDraft = (draft) => {
  const [
    first,
    ...rest
  ] = draft.split("\n");
  const body = rest
    .join("\n")
    .trim();
  const [
    ,
    id,
    title
  ] = first.match(/<h1(?: id="(.*?)")?>(.*?)<\/h1>/u);
  return {
    body,
    id,
    title: unescapeReferences(title.replace(/<.*?>/gu, ""))
  };
};

const toMenuitem = ({ title }, index) => `${String(index + 1)}. ${title}`;

const rebuildDraft = ({
  body,
  id,
  title
}) => `<h1 id="${id}">${escapeCharacters(title)}</h1>

${body}
`;

const selectDraft = async () => {
  const file = config.src.draft;
  const html = await fs.readFile(file, "utf8");
  const sections = html.split("\n\n\n");
  const drafts = await Promise.all(sections.map(toDraft));
  const menuitems = await Promise.all(drafts.map(toMenuitem));
  const menu = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const menulist = menuitems.join("\n");
  menu.write(`0. QUIT
${menulist}
`);
  const input = await menu.question("Which one? (0) ");
  menu.close();
  const answer = parseInt(input, 10);

  if (!Number.isInteger(answer) || answer > drafts.length) {
    throw new Error(`You must enter a number between 0 and ${drafts.length}.`);
  }

  if (answer === 0) {
    throw new Error("Aborted.");
  }

  const [ selected ] = drafts.splice(answer - 1, 1);
  const rebuilt = await Promise.all([
    selected,
    ...drafts
  ].map(rebuildDraft));
  await outputFile(file, rebuilt.join("\n\n"));
  return selected;
};

export { selectDraft };
