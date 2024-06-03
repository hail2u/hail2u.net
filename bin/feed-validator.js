import config from "../config.js";
import fastXMLParser from "fast-xml-parser";
import fs from "node:fs/promises";
import { guessPath } from "./lib/guess-path.js";

const toDest = (file) => guessPath(file, config.dir.dest, "feed");

const gatherFiles = async () => {
  const files = await fs.glob(`${config.dir.template}**/_feed.mustache`);
  return Array.fromAsync(files, toDest);
};

const cancelFetch = (abortController) => {
  abortController.abort();
};

const parseXML = (xml) => {
  const parser = new fastXMLParser.XMLParser({
    arrayMode: /^error$/iu,
    removeNSPrefix: true,
  });
  const json = parser.parse(xml);
  return json.Envelope.Body.feedvalidationresponse.errors;
};

const validateFeed = async (feed) => {
  const body = new URLSearchParams();
  body.append("manual", 1);
  body.append("output", "soap12");
  body.append("rawdata", feed);
  const abortController = new AbortController();
  const abortID = setTimeout(cancelFetch.bind(null, abortController), 10000);

  try {
    const res = await fetch("https://validator.w3.org/feed/check.cgi", {
      body,
      method: "POST",
      signal: abortController.signal,
    });

    if (!res.ok) {
      return `Skipped. ${res.status} ${res.statusText}.`;
    }

    const xml = await res.text();
    const json = await parseXML(xml);
    const errorcount = parseInt(json.errorcount, 10);

    if (errorcount === 0) {
      return null;
    }

    return json.errorlist.error;
  } catch (e) {
    if (e.name === "AbortError") {
      return "Skipped. W3C Feed Validator does not respond in 10s.";
    }

    throw e;
  } finally {
    clearTimeout(abortID);
  }
};

const formatMessage = (file, message) =>
  `${file}:${message.line}:${message.column}: ${message.text} (${message.msgcount}).`;

const validate = async (file) => {
  const feed = await fs.readFile(file, "utf8");
  const messages = await validateFeed(feed);

  if (!messages) {
    return [];
  }

  if (typeof messages === "string") {
    process.stdout.write(`${file}:1:1: ${messages}
`);
    return [];
  }

  return Promise.all(messages.map(formatMessage.bind(null, file)));
};

const isNotEmpty = (element) => element.length !== 0;

const main = async () => {
  const feeds = await gatherFiles();
  const results = await Promise.all(feeds.map(validate));
  const errors = results.flat();

  if (errors.length > 0) {
    process.stdout.write(errors.join("\n"));
    process.stdout.write("\n\n");
    const errorFiles = results.filter(isNotEmpty);
    throw new Error(
      `${errors.length} error(s) in ${errorFiles.length} file(s)`,
    );
  }
};

main().catch((e) => {
  throw e;
});
