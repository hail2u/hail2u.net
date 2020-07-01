/* global testContrastRatio */

const lightnessVariation = ["49%", "34%", "33%", "33%", "52%", "50%"];
const rootStyle = document.documentElement.style;

const updateHue = (entries) => {
	if (entries[0].isIntersecting) {
		return;
	}

	const roll = Math.floor(Math.random() * 6);
	const hue = roll * 60 - 15;
	rootStyle.setProperty("--hue", hue);
	rootStyle.setProperty("--lightness", lightnessVariation[roll]);

	if (typeof testContrastRatio === "function") {
		testContrastRatio();
	}
};

updateHue([{
	"isIntersecting": false
}]);
