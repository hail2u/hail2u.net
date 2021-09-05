import fetch from "node-fetch";
import xml2js from "xml2js";

const cancelFetch = (abortController) => {
	abortController.abort();
};

const removeNamespace = (name) => name.replace(/^\w+:/u, "");

const parseXML = async (xml) => {
	const json = await xml2js.parseStringPromise(xml, {
		"explicitArray": false,
		"ignoreAttrs": true,
		"normalizeTags": true,
		"tagNameProcessors": [removeNamespace]
	});
	return json.envelope.body.feedvalidationresponse.errors;
};

const validateFeed = async (feed) => {
	const abortController = new AbortController();
	const abortID = setTimeout(cancelFetch.bind(null, abortController), 10000);

	try {
		const res = await fetch("https://validator.w3.org/feed/check.cgi", {
			headers: {
				"Content-type": "application/x-www-form-urlencoded"
			},
			body: [`manual=1&output=soap12&rawdata=${encodeURIComponent(feed)}`],
			method: "POST",
			signal: abortController.signal
		});

		if (res.status !== 200) {
			return `Skipped. ${res.status} ${res.statusText}.`;
		}

		const json = await res.text().then(parseXML);
		const errorcount = parseInt(json.errorcount, 10);

		switch (errorcount) {
			case 0:
				return "No errors.";

			case 1:
				return [json.errorlist.error];

			default:
				return json.errorlist.error;
		}
	} catch (e) {
		if (e.type === "aborted") {
			return `Skipped. W3C Feed Validator does not respond in 10s.`;
		}

		throw e;
	} finally {
		clearTimeout(abortID);
	}
};

export { validateFeed };
