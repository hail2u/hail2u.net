// https://github.com/Myndex/SAPC-APCA#the-plain-english-steps-are
// 0.98d12e
const testContrast_linearizeColorComponent = (val) => (val / 255.0) ** 2.4;

const testContrast_clampLuminance = (luminance) => {
	const blkThrs = 0.03;
	const blkClmp = 1.45;

	if (luminance > blkThrs) {
		return luminance;
	}

	return Math.abs(blkThrs - luminance) ** blkClmp + luminance;
};

const testContrast_getLuminance = (color) => {
	const [
		red,
		green,
		blue
	] = color.match(/\d+/gu);
	const luminance =
		0.2126729 * testContrast_linearizeColorComponent(red) +
		0.7151522 * testContrast_linearizeColorComponent(green) +
		0.072175 * testContrast_linearizeColorComponent(blue);
	return testContrast_clampLuminance(luminance);
};

const testContrast_getPerceptualContrast = (backgroundLuminance, foregroundLuminance) => {
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

const testContrast_scaleContrast = (contrast) => {
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

const testContrast_toScore = (float) => (float * 100).toFixed(3);

const testContrast_getScore = (background, foreground) => {
	const backgroundLuminance = testContrast_getLuminance(background);
	const foregroundLuminance = testContrast_getLuminance(foreground);
	const contrast = testContrast_getPerceptualContrast(backgroundLuminance, foregroundLuminance);
	const scaled = testContrast_scaleContrast(contrast);
	return testContrast_toScore(scaled);
};

/* https://www.w3.org/TR/WCAG21/#dfn-relative-luminance */
const testContrast_getComponentLuminance = (color) => {
	const sRGB = color / 255;

	if (sRGB <= 0.03928) {
		return sRGB / 12.92;
	}

	return ((sRGB + 0.055) / 1.055) ** 2.4;
};

const testContrast_getRelativeLuminance = ([red, green, blue]) =>
	0.2126 * testContrast_getComponentLuminance(red) +
	0.7152 * testContrast_getComponentLuminance(green) +
	0.0722 * testContrast_getComponentLuminance(blue);

/* https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio */
const testContrast_getContrast = (foreground, background) => {
	const backgroundLuminance = testContrast_getRelativeLuminance(background.match(/\d+/gu));
	const foregroundLuminance = testContrast_getRelativeLuminance(foreground.match(/\d+/gu));
	const lighter = Math.max(backgroundLuminance, foregroundLuminance);
	const darker = Math.min(backgroundLuminance, foregroundLuminance);
	return parseFloat((lighter + 0.05) / (darker + 0.05)).toFixed(3);
};

const testContrast = () => {
	const queryColorCell = ".test-color > tbody > tr > td:nth-child(2)";
	const colorCells = document.querySelectorAll(queryColorCell);

	for (const colorCell of colorCells) {
		const style = getComputedStyle(colorCell);
		const background = style.getPropertyValue("background-color");
		const foreground = style.getPropertyValue("color");
		colorCell.lastChild.textContent = background;
		const contrastCell = colorCell.nextElementSibling;
		const ratio = testContrast_getContrast(foreground, background);

		if (colorCell.classList.contains("js-test-color-flip")) {
			const score = testContrast_getScore(foreground, background);
			contrastCell.lastChild.textContent = `${score} (${ratio})`;
			continue;
		}

		const score = testContrast_getScore(background, foreground);
		contrastCell.lastChild.textContent = `${score} (${ratio})`;
	}
};

window.addEventListener("load", testContrast);
