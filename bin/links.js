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
  string: ["asin", "title", "type", "url"],
  unknown: false
});
const nonfictionsFile = "../src/links/nonfictions.json";
const comicsFile = "../src/links/comics.json";
const execFileAsync = promisify(execFile);
const novelsFile = "../src/links/novels.json";
const urlsFile = "../src/links/urls.json";
const whichAsync = promisify(which);

const readJSONFile = async file => {
  const json = await fs.readFile(file, "utf8");
  return JSON.parse(json);
};

const runCommand = async (command, args) => {
  const { stdout } = await execFileAsync(command, args);
  return process.stdout.write(stdout);
};

const addBook = async (file, asin, title, git) => {
  const books = await readJSONFile(file);
  await fs.writeFile(
    file,
    `${JSON.stringify([...books, {
      added: Date.now(),
      asin: asin,
      title: title
    }], null, 2)}
`
  );
  await runCommand(git, ["add", "--", path.relative("", file)]);
  await runCommand(git, ["commit", `--message=Read ${asin}`]);
};

const addURL = async (title, url, git) => {
  const urls = await readJSONFile(urlsFile);
  await fs.writeFile(
    urlsFile,
    `${JSON.stringify([...urls, {
      added: Date.now(),
      title: title,
      url: url
    }], null, 2)}
`
  );
  await runCommand(git, ["add", "--", path.relative("", urlsFile)]);
  await runCommand(git, ["commit", `--message=Bookmark ${url}`]);
};

const main = async () => {
  if (argv._.length > 0) {
    throw new Error("Unknown option is passed.")
  }

  if (!argv.title) {
    throw new Error("Title must be passed.");
  }

  if (!argv.asin && !argv.url) {
    throw new Error("ASIN or URL must be passed.");
  }

  const git = await whichAsync("git");

  if (argv.url) {
    return addURL(argv.title, argv.url, git);
  }

  if (argv.type === "comic") {
    return addBook(comicsFile, argv.asin, argv.title, git);
  }

  if (argv.type === "novel") {
    return addBook(novelsFile, argv.asin, argv.title, git);
  }

  return addBook(nonfictionsFile, argv.asin, argv.title, git);
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
