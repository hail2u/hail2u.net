import FormData from "form-data";
import fetch from "node-fetch";

const abortFetch = (abortController) => {
	abortController.abort();
};

const validateHTML = async (html) => {
	const form = new FormData();
	form.append("level", "error");
	form.append("out", "json");
	form.append("content", html);
	const abortController = new AbortController();
	const abortFetchB = abortFetch.bind(null, abortController);
	const abortID = setTimeout(abortFetchB, 5000);

	try {
		const res = await fetch("https://validator.w3.org/nu/", {
			method: "POST",
			body: form,
			signal: abortController.signal,
		});

		if (res.status !== 200) {
			return `Skipped. ${res.status} ${res.statusText}.`;
		}

		const json = await res.json();

		if (json.messages.length === 0) {
			return "No errors.";
		}

		return json.messages;
	} catch (e) {
		return `Skipped. Nu HTML Checker does not respond in 5s.`;
	} finally {
		clearTimeout(abortID);
	}
};

export { validateHTML };
