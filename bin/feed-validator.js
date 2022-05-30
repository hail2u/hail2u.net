import config from "../.config.js";
import fastXMLParser from "fast-xml-parser";
import fs from "node:fs/promises";

const cancelFetch = (abortController) => {
	abortController.abort();
};

const parseXML = (xml) => {
	const json = fastXMLParser.parse(xml, {
		"arrayMode": /^error$/iu,
		"ignoreNameSpace": true
	});
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
			signal: abortController.signal
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

const formatMessage = (file, message) => `${file}:${message.line}:${message.column}: ${message.text} (${message.msgcount}).`;

const validate = async ({ dest: file }) => {
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

	return messages.map(formatMessage.bind(null, file));
};

const isNotEmpty = (element) => element.length !== 0;

const main = async () => {
	const results = await Promise.all(config.feed.map(validate));
	const errors = results.flat();

	if (errors.length > 0) {
		process.stdout.write(errors.join("\n"));
		process.stdout.write("\n\n");
		const errorFiles = results.filter(isNotEmpty);
		throw new Error(`${errors.length} error(s) in ${errorFiles.length} file(s)`);
	}
};

main().catch((e) => {
	/* eslint-disable-next-line no-console */
	console.trace(e);
	process.exitCode = 1;
});
