const fs = require("fs-extra");
const minifyHTML = require("../lib/html-minifier");
const minimist = require("minimist");
const mustache = require("mustache");
const path = require("path");
const toPOSIXPath = require("../lib/to-posix-path");

const argv = minimist(process.argv.slice(2), {
  boolean: ["articles"],
  string: ["article"]
});
const articleJSON = "../src/blog/article.json";
const articleSrc = "../src/blog/article.mustache";
const destDir = "../dist/";
const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const entityMap = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;"
};
const escapeRe = new RegExp(`[${Object.keys(entityMap).join("")}]`, "g");
const files = [
  {
    dest: "../dist/about/index.html",
    json: "../src/about/index.json",
    src: "../src/about/index.mustache"
  },
  {
    dest: "../dist/blog/feed",
    json: "../src/blog/index.json",
    itemLength: 10,
    src: "../src/blog/feed.mustache"
  },
  {
    dest: "../dist/blog/index.html",
    json: "../src/blog/index.json",
    src: "../src/blog/index.mustache"
  },
  {
    dest: "../src/blosxom/entries/themes/html/page",
    json: "../src/blog/theme.json",
    src: "../src/blog/theme.mustache"
  },
  {
    dest: "../dist/documents/index.html",
    json: "../src/documents/index.json",
    src: "../src/documents/index.mustache"
  },
  {
    dest: "../dist/projects/index.html",
    json: "../src/projects/index.json",
    src: "../src/projects/index.mustache"
  },
  {
    dest: "../dist/feed",
    json: "../src/index.json",
    itemLength: 10,
    src: "../src/feed.mustache"
  },
  {
    dest: "../dist/index.html",
    json: "../src/index.json",
    includeUpdates: true,
    itemLength: 10,
    src: "../src/index.mustache"
  },
  {
    dest: "../dist/sitemap.xml",
    json: "../src/index.json",
    src: "../src/sitemap.mustache"
  }
];
const itemFiles = ["../src/blog/articles.json", "../src/updates.json"];
const metadataFile = "../src/metadata.json";
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
const partialDir = "../src/partial/";

const escapeChar = char => entityMap[char];

const escapeStr = str => String(str).replace(escapeRe, escapeChar);

const readJSON = filepath => fs.readJSON(filepath, "utf8");

const sortByDate = (a, b) =>
  parseInt(a.unixtime, 10) - parseInt(b.unixtime, 10);

const pad = number => {
  if (number >= 10) {
    return number;
  }

  return `0${number}`;
};

const toHTML5String = (day, date, month, year, hour, minute, second) =>
  `${year}-${pad(month)}-${pad(date)}T${pad(hour)}:${pad(minute)}:${pad(
    second
  )}+09:00`;

const toRFC822String = (day, date, month, year, hour, minute, second) =>
  `${dowNames[day]}, ${date} ${monthNames[month - 1]} ${year} ${pad(
    hour
  )}:${pad(minute)}:${pad(second)} +0900`;

const extendItem = (item, index, items) => {
  const dt = new Date(item.unixtime);
  item.date = dt.getDate();
  item.day = dt.getDay();
  item.hour = dt.getHours();
  item.minute = dt.getMinutes();
  item.month = dt.getMonth() + 1;
  item.second = dt.getSeconds();
  item.year = dt.getFullYear();
  item.html5PubDate = toHTML5String(
    item.day,
    item.date,
    item.month,
    item.year,
    item.hour,
    item.minute,
    item.second
  );
  item.rfc822PubDate = toRFC822String(
    item.day,
    item.date,
    item.month,
    item.year,
    item.hour,
    item.minute,
    item.second
  );
  item.strPubDate = `${pad(item.month)}/${pad(item.date)}`;
  item.description = item.body
    .replace(/\r?\n/g, "")
    .replace(/^.*?<p.*?>(.*?)<\/p>.*?$/, "$1")
    .replace(/<.*?>/g, "");
  item.body = item.body.replace(
    /(href|src)="(\/.*?)"/g,
    '$1="https://hail2u.net$2"'
  );

  if (index === 0) {
    item.isLatest = true;
    item.isFirstInYear = true;
    items[items.length - 1].isLastInYear = true;
    return item;
  }

  const previousItem = items[index - 1];

  if (item.year !== previousItem.year) {
    item.isFirstInYear = true;
    previousItem.isLastInYear = true;
  }

  return item;
};

const gatherItems = items =>
  []
    .concat(...items)
    .sort(sortByDate)
    .reverse()
    .map(extendItem);

const readItems = async () => {
  const items = await Promise.all(itemFiles.map(readJSON));
  return gatherItems(items);
};

const readFile = filepath => fs.readFile(filepath, "utf8");

const readPartial = async filename => ({
  [path.basename(filename, ".mustache")]: await readFile(
    path.join(partialDir, filename)
  )
});

const gatherPartials = partials => Object.assign(...partials);

const readPartials = async () => {
  const filenames = await fs.readdir(partialDir);
  const partials = await Promise.all(filenames.map(readPartial));
  return gatherPartials(partials);
};

const pickByLink = (dest, item) => dest.endsWith(item.link);

const filterUpdates = (includeUpdates, item) => {
  if (item.link.startsWith("/blog/")) {
    return true;
  }

  if (includeUpdates) {
    return true;
  }

  return false;
};

const findCover = (image, defaultCardType, defaultCover) => {
  if (!image) {
    return [defaultCardType, defaultCover];
  }

  return ["summary_large_image", image[1]];
};

const now = date =>
  toRFC822String(
    date.getDay(),
    date.getDate(),
    date.getMonth() + 1,
    date.getFullYear(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );

const mergeData = file => {
  if (argv.article || argv.articles) {
    const data = {
      ...file.extradata,
      ...file.items.find(pickByLink.bind(null, file.dest))
    };
    data.canonical = data.link;
    [data.card_type, data.cover] = findCover(
      /<img\s.*?\bsrc="https:\/\/hail2u\.net(\/img\/blog\/.*?)"/.exec(
        data.body
      ),
      file.metadata.card_type,
      file.metadata.cover
    );
    data.short_title = data.title;
    return {
      ...file.metadata,
      ...data
    };
  }

  return {
    ...file.metadata,
    ...file.extradata,
    ...{
      items: file.items
        .concat()
        .filter(filterUpdates.bind(null, file.includeUpdates))
        .slice(0, file.itemLength),
      lastBuildDate: now(new Date())
    }
  };
};

const render = (template, data, partials) =>
  mustache.render(template, data, partials);

const minifyContents = html =>
  minifyHTML(html).replace(
    /(href|src)="https:\/\/hail2u\.net(\/.*?)"/g,
    '$1="$2"'
  );

const writeFile = (filepath, data) => fs.outputFile(filepath, data);

const build = async (metadata, items, partials, file) => {
  const built = {
    ...{
      items: items,
      metadata: metadata,
      partials: partials
    },
    ...file
  };

  built.template = await readFile(built.src);
  built.extradata = await readJSON(built.json);
  built.data = await mergeData(built);
  built.contents = await render(built.template, built.data, built.partials);

  if (file.dest.endsWith(".html")) {
    built.contents = minifyContents(built.contents);
  }

  await writeFile(built.dest, built.contents);
};

const mergeArticle = item => ({
  ...{
    dest: toPOSIXPath(path.join(destDir, item.link)),
    json: articleJSON,
    src: articleSrc
  },
  ...item
});

const generateArticles = items =>
  items.filter(filterUpdates.bind(null, false)).map(mergeArticle);

const main = async () => {
  const [metadata, items, partials] = await Promise.all([
    readJSON(metadataFile),
    readItems(),
    readPartials()
  ]);

  if (argv.article) {
    return build(metadata, items, partials, {
      dest: argv.article,
      json: articleJSON,
      src: articleSrc
    });
  }

  if (argv.articles) {
    const articles = await generateArticles(items);
    return Promise.all(
      articles.map(build.bind(null, metadata, items, partials))
    );
  }

  return Promise.all(files.map(build.bind(null, metadata, items, partials)));
};

process.chdir(__dirname);
mustache.escape = escapeStr;
main().catch(e => {
  console.trace(e);
});
