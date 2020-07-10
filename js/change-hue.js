(() => {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		return;
	}

	const rootStyle = document.documentElement.style;
	const lightnessVariation = ["49%", "34%", "32%", "32%", "52%", "50%"];

	const change = () => {
		const roll = Math.floor(Math.random() * 6);
		const hue = roll * 60 - 15;
		rootStyle.setProperty("--hue", hue);
		rootStyle.setProperty("--lightness", lightnessVariation[roll]);

		if (typeof testContrastRatio === "function") {
			/* global testContrastRatio */
			testContrastRatio();
		}
	};

	window.changeHue = change;
	change();
})();
