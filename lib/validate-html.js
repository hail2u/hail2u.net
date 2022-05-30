const formatMessage = (file, offset, {
	lastColumn,
	lastLine,
	message
}) => `${file}:${lastLine + offset}:${lastColumn}: ${message}`;

const cancelFetch = (abortController) => {
	abortController.abort();
};

const validateHTML = async (html) => {
	const body = new FormData();
	body.append("level", "error");
	body.append("out", "json");
	body.append("content", html);
	const abortController = new AbortController();
	const abortID = setTimeout(cancelFetch.bind(null, abortController), 10000);

	try {
		const res = await fetch("https://validator.w3.org/nu/", {
			body,
			method: "POST",
			signal: abortController.signal
		});

		if (!res.ok) {
			process.stdout.write(`Skipped. ${res.status} ${res.statusText}.
`);
			return null;
		}

		const json = await res.json();

		if (json.messages.length === 0) {
			return null;
		}

		return json.messages;
	} catch (e) {
		if (e.name === "AbortError") {
			process.stdout.write(`Skipped. Nu HTML Checker does not respond in 10s.
`);
			return null;
		}

		throw e;
	} finally {
		clearTimeout(abortID);
	}
};

const writeErrors = (errors, errorFiles) => {
	process.stdout.write(errors.join("\n"));
	process.stdout.write("\n\n");
	throw new Error(`${errors.length} error(s) in ${errorFiles.length} file(s).`);
};

export {
	formatMessage,
	validateHTML,
	writeErrors
};
