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
	const json = await res.json();
	return json.messages;
};

export { validateHTML };
