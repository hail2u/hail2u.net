import { XMLParser } from "fast-xml-parser";
import config from "../config.js";
import fs from "node:fs/promises";

const cancelFetch = (abortController) => {
  abortController.abort();
};

const parseXML = (xml) => {
  const parser = new XMLParser({
    arrayMode: /^error$/iv,
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
  const abortID = setTimeout(
    cancelFetch.bind(null, abortController),
    config.test.timeout,
  );

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
      return `Skipped. W3C Feed Validator does not respond in ${config.test.timeout}s.`;
    }

    throw e;
  } finally {
    clearTimeout(abortID);
  }
};

const formatMessage = (file, { column, line, msgcount, text }) =>
  `${file}:${line}:${column}: ${text} (${msgcount}).`;

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

const globber = fs.glob(`${config.dir.dest}**/feed`);
const feeds = await Array.fromAsync(globber);
const results = await Promise.all(feeds.map(validate));
const errors = results.flat();

if (errors.length > 0) {
  const errorFiles = results.filter(isNotEmpty);
  process.stderr.write(errors.join("\n"));
  process.stderr.write("\n\n");
  throw new Error(`${errors.length} error(s) in ${errorFiles.length} file(s)`);
}
