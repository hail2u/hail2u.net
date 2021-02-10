// https://github.com/Myndex/SAPC-APCA#the-plain-english-steps-are
const testContrastLinearizeColorComponent = (val) => (val / 255.0) ** 2.4;

const testContrastClampLuminance = (luminance) => {
	const blkThrs = 0.03;
	const blkClmp = 1.45;

	if (luminance > blkThrs) {
		return luminance;
	}

	return Math.abs(blkThrs - luminance) ** blkClmp + luminance;
};

const testContrastGetLuminance = (color) => {
	const [red, green, blue] = color.match(/\d+/gu);
	const luminance =
		0.2126729 * testContrastLinearizeColorComponent(red) +
		0.7151522 * testContrastLinearizeColorComponent(green) +
		0.072175 * testContrastLinearizeColorComponent(blue);
	return testContrastClampLuminance(luminance);
};

const testContrastGetPerceptualContrast = (
	backgroundLuminance,
	foregroundLuminance
) => {
	const deltaYmin = 0.0005;
	const scale = 1.25;

	if (Math.abs(backgroundLuminance - foregroundLuminance) < deltaYmin) {
		return 0.0;
	}

	if (backgroundLuminance > foregroundLuminance) {
		return (backgroundLuminance ** 0.55 - foregroundLuminance ** 0.58) * scale;
	}

	if (backgroundLuminance < foregroundLuminance) {
		return (backgroundLuminance ** 0.62 - foregroundLuminance ** 0.57) * scale;
	}

	return 0.0;
};

const testContrastScaleContrast = (contrast) => {
	const loClip = 0.001;
	const loConThresh = 0.078;
	const loConFactor = 1 / loConThresh;
	const loConOffset = 0.06;

	const absContrast = Math.abs(contrast);

	if (absContrast < loClip) {
		return 0.0;
	}

	if (absContrast <= loConThresh) {
		return contrast - contrast * loConFactor * loConOffset;
	}

	if (contrast > loConThresh) {
		return contrast - loConOffset;
	}

	if (contrast < 0 - loConThresh) {
		return contrast + loConOffset;
	}

	return 0.0;
};

const testContrastToScore = (float) => (float * 100).toFixed(3);

const testContrastGetScore = (background, foreground) => {
	const backgroundLuminance = testContrastGetLuminance(background);
	const foregroundLuminance = testContrastGetLuminance(foreground);
	const contrast = testContrastGetPerceptualContrast(
		backgroundLuminance,
		foregroundLuminance
	);
	const scaled = testContrastScaleContrast(contrast);
	return testContrastToScore(scaled);
};

const testContrast = () => {
	const queryColorCell = ".test-color > tbody > tr > td:first-child";
	const colorCells = document.querySelectorAll(queryColorCell);

	for (const colorCell of colorCells) {
		const style = getComputedStyle(colorCell);
		const background = style.getPropertyValue("background-color");
		const foreground = style.getPropertyValue("color");
		colorCell.lastChild.textContent = background;
		const contrastCell = colorCell.nextElementSibling;

		if (colorCell.classList.contains("js-test-color-flip")) {
			const score = testContrastGetScore(foreground, background);
			contrastCell.lastChild.textContent = `${score}`;
			continue;
		}

		const score = testContrastGetScore(background, foreground);
		contrastCell.lastChild.textContent = `${score}`;
	}
};

window.addEventListener("load", testContrast);
