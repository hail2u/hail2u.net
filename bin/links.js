const { execFile } = require("child_process");
const fs = require("fs").promises;
const minimist = require("minimist");
const path = require("path");
const { promisify } = require("util");
const which = require("which");

const argv = minimist(process.argv.slice(2), {
  alias: {
    a: "asin",
    t: "title",
    y: "type",
    u: "url"
  },
  default: {
    asin: "",
    title: "",
    type: "",
    url: ""
  },
  string: ["asin", "title", "type", "url"]
});
const nonfictionsFile = "../src/links/nonfictions.json";
const comicsFile = "../src/links/comics.json";
const execFileAsync = promisify(execFile);
const novelsFile = "../src/links/novels.json";
const urlsFile = "../src/links/urls.json";
const whichAsync = promisify(which);

const selectFile = type => {
  if (type === "comic") {
    return comicsFile;
  }

  if (type === "novel") {
    return novelsFile;
  }

  return nonfictionsFile;
};

const readJSONFile = async file => {
  const json = await fs.readFile(file, "utf8");
  return JSON.parse(json);
};

const runCommand = async (command, args) => {
  const { stdout } = await execFileAsync(command, args);
  return process.stdout.write(stdout);
};

const addBook = async (asin, title, type, git) => {
  const file = selectFile(type);
  const books = await readJSONFile(file);
  await fs.writeFile(file, `${JSON.stringify([{
    published: Date.now(),
    asin: asin,
    title: title
  }, ...books], null, 2)}
`);
  await runCommand(git, ["add", "--", path.relative("", file)]);
  await runCommand(git, ["commit", `--message=Read ${asin}`]);
};

const addURL = async (title, url, git) => {
  const urls = await readJSONFile(urlsFile);
  await fs.writeFile(urlsFile, `${JSON.stringify([{
    published: Date.now(),
    title: title,
    url: url
  }, ...urls], null, 2)}
`);
  await runCommand(git, ["add", "--", path.relative("", urlsFile)]);
  await runCommand(git, ["commit", `--message=Bookmark ${url}`]);
};

const main = async () => {
  if (!argv.title) {
    throw new Error("Title must be passed.");
  }

  const git = await whichAsync("git");

  if (argv.asin) {
    return addBook(argv.asin, argv.title, argv.type, git);
  }

  if (argv.url) {
    return addURL(argv.title, argv.url, git);
  }

  throw new Error("ASIN or URL must be passed.");
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
