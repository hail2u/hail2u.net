import { escapeCharacters, unescapeReferences } from "./character-reference.js";
import config from "../../config.js";
import fs from "node:fs/promises";
import { getDateDetails } from "./get-date-details.js";
import path from "node:path";
import readline from "node:readline/promises";

const toDraft = (draft) => {
  const [first, ...rest] = draft.split("\n");
  const body = rest.join("\n").trim();
  const [, id, title] = first.match(/<h1(?: id="(.*?)")?>(.*?)<\/h1>/u);
  return {
    body,
    id,
    title: unescapeReferences(title.replace(/<.*?>/gu, "")),
  };
};

const toMenuitem = ({ title }, index) => `${String(index + 1)}. ${title}`;

const rebuildDraft = ({ body, id, title }) => {
  if (!id) {
    return `<h1>${escapeCharacters(title)}</h1>

${body}
`;
  }

  return `<h1 id="${id}">${escapeCharacters(title)}</h1>

${body}
`;
};

const selectDraft = async () => {
  const file = config.file.draft;
  const html = await fs.readFile(file, "utf8");
  const sections = html.split("\n\n\n");
  const drafts = await Promise.all(sections.map(toDraft));
  const menuitems = await Promise.all(drafts.map(toMenuitem));
  const menu = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const menulist = menuitems.join("\n");
  menu.write(`0. QUIT
${menulist}
`);
  const input = await menu.question("Which one? (0) ");
  menu.close();
  const answer = parseInt(input.at(0), 10);

  if (!Number.isInteger(answer) || answer > drafts.length) {
    throw new Error(`You must enter a number between 0 and ${drafts.length}.`);
  }

  if (answer === 0) {
    throw new Error("Aborted.");
  }

  const index = answer - 1;
  const selected = drafts[index];
  const remains = drafts.toSpliced(index, 1);
  const rebuilt = await Promise.all([selected, ...remains].map(rebuildDraft));
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, rebuilt.join("\n\n"));

  if (selected.id) {
    return selected;
  }

  const now = Date.now();
  const dt = getDateDetails(now);
  return {
    ...selected,
    id: `${dt.strYear}-${dt.strMonth}-${dt.strDate}`,
  };
};

export { selectDraft };
