import { runCommand } from "./run-command.js";

const openTwitter = async (text) => {
  const twitter = new URL("https://x.com/intent/tweet");
  twitter.searchParams.append("text", text);
  await runCommand("open", [twitter.href]);
};

export { openTwitter };
