import config from "../.config.js";
import fs from "fs/promises";
import { validateFeed } from "../lib/validate-feed.js";

const formatMessage = (file, message) =>
	`${file}:${message.line}:${message.column}: ${message.text} (${message.msgcount}).`;

const validate = async (file) => {
	const feed = await fs.readFile(file.dest, "utf8");
	const messages = await validateFeed(feed);

	if (typeof messages === "string") {
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
