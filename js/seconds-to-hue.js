const secondsToHue = (now) => {
	const seconds = Math.floor(now.getSeconds() / 10);
	const hue = seconds * 60 - 15;
	const lightness = ["49%", "34%", "33%", "33%", "52%", "50%"];
	document.documentElement.style = `--hue:${hue};--lightness:${lightness[seconds]}`;
};

secondsToHue(new Date());
