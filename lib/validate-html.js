import FormData from "form-data";
import fetch from "node-fetch";

const cancelFetch = (abortController) => {
	abortController.abort();
};

const validateHTML = async (html) => {
	const form = new FormData();
	form.append("level", "error");
	form.append("out", "json");
	form.append("content", html);
	const abortController = new AbortController();
	const abortID = setTimeout(cancelFetch.bind(null, abortController), 10000);

	try {
		const res = await fetch("https://validator.w3.org/nu/", {
			body: form,
			method: "POST",
			signal: abortController.signal
		});

		if (!res.ok) {
			return `Skipped. ${res.status} ${res.statusText}.`;
		}

		const json = await res.json();

		if (json.messages.length === 0) {
			return null;
		}

		return json.messages;
	} catch (e) {
		if (e.type === "aborted") {
			return "Skipped. Nu HTML Checker does not respond in 10s.";
		}

		throw e;
	} finally {
		clearTimeout(abortID);
	}
};

export { validateHTML };
