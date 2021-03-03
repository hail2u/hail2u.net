import { runCommand } from "./run-command.js";

const openTwitter = async (text) => {
	const encoded = encodeURIComponent(`${text}`);
	await runCommand("open", [`twitter://post?text=${encoded}`]);
};

export { openTwitter };
