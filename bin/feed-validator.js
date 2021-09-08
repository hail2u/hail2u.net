import config from "../.config.js";
import fastXMLParser from "fast-xml-parser";
import fetch from "node-fetch";
import fs from "fs/promises";

const cancelFetch = (abortController) => {
	abortController.abort();
};

const parseXML = (xml) => {
	const json = fastXMLParser.parse(xml, {
		"ignoreNameSpace": true
	});
	return json.Envelope.Body.feedvalidationresponse.errors;
};

const validateFeed = async (feed) => {
	const encoded = encodeURIComponent(feed);
	const abortController = new AbortController();
	const abortID = setTimeout(cancelFetch.bind(null, abortController), 10000);

	try {
		const res = await fetch("https://validator.w3.org/feed/check.cgi", {
			body: `manual=1&output=soap12&rawdata=${encoded}`,
			headers: {
				"Content-type": "application/x-www-form-urlencoded"
			},
			method: "POST",
			signal: abortController.signal
		});

		if (!res.ok) {
			return `Skipped. ${res.status} ${res.statusText}.`;
		}

		const json = await res.text().then(parseXML);
		const errorcount = parseInt(json.errorcount, 10);

		switch (errorcount) {
			case 0:
				return null;

			case 1:
				return [json.errorlist.error];

			default:
				return json.errorlist.error;
		}
	} catch (e) {
		if (e.type === "aborted") {
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
	const feed = await fs.readFile(file.dest, "utf8");
	const messages = await validateFeed(feed);

	if (!messages) {
		return [];
	}

	if (typeof messages === "string") {
		process.stdout.write(`${file.dest}:1:1: ${messages}
`);
		return [];
	}

	return messages.map(formatMessage.bind(null, file.dest));
};

const isNotEmpty = (element) => element.length !== 0;

const main = async () => {
	const results = await Promise.all(config.files.feed.map(validate));
	const errors = results.flat();

	if (errors.length > 0) {
		process.stdout.write(errors.join("\n"));
		process.stdout.write("\n\n");
		const errorFiles = results.filter(isNotEmpty);
		throw new Error(`${errors.length} error(s) in ${errorFiles.length} file(s)`);
	}
};

main().catch((e) => {
	console.trace(e);
	process.exitCode = 1;
});
