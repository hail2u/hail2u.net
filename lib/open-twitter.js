import { runCommand } from "./run-command.js";

const openTwitter = async (text) => {
	const encoded = encodeURIComponent(text);
	await runCommand("open", [`https://twitter.com/intent/tweet?text=${encoded}`]);
};

export { openTwitter };
