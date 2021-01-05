import FormData from "form-data";
import fetch from "node-fetch";

const validateHTML = async (html) => {
	const form = new FormData();
	form.append("level", "error");
	form.append("out", "json");
	form.append("content", html);
	const res = await fetch("https://validator.w3.org/nu/", {
		method: "POST",
		body: form,
	});

	if (res.status !== 200) {
		return `Skipped due to Nu Html Checker seems to be down: ${res.status} ${res.statusText}.`;
	}

	const json = await res.json();

	if (json.messages.length === 0) {
		return "No errors.";
	}

	return json.messages;
};

export { validateHTML };
