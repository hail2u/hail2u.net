import fastXMLParser from "fast-xml-parser";
import fetch from "node-fetch";

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
				return "No errors.";

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

export { validateFeed };
