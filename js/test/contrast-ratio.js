// https://github.com/Myndex/SAPC-APCA#the-plain-english-steps-are

const selectColor = (classes, background, foreground) => {
	if (classes.contains("bg")) {
		return background;
	}

	return foreground;
};

const linearize = (val) => (val / 255.0) ** 2.4;

const clampLuminance = (luminance) => {
	const blkThrs = 0.03;
	const blkClmp = 1.45;

	if (luminance > blkThrs) {
		return luminance;
	}

	return Math.abs(blkThrs - luminance) ** blkClmp + luminance;
};

const getLuminance = (color) => {
	const [red, green, blue] = color.match(/\d+/gu);
	const y =
		0.2126729 * linearize(red) +
		0.7151522 * linearize(green) +
		0.072175 * linearize(blue);
	return clampLuminance(y);
};

const getContrast = (background, foreground) => {
	const deltaYmin = 0.0005;
	const scale = 1.25;

	const backgroundLuminance = getLuminance(background);
	const foregroundLuminance = getLuminance(foreground);

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

const scaleContrast = (contrast) => {
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

	if (contrast < -loConThresh) {
		return contrast + loConOffset;
	}

	return 0.0;
};

const toPercentage = (float) => (float * 100).toFixed(3);

const testContrast = () => {
	const queryColorCell = ".test-color > tbody > tr > td:first-child";
	const colorCells = document.querySelectorAll(queryColorCell);

	for (const colorCell of colorCells) {
		const style = getComputedStyle(colorCell);
		const background = style.getPropertyValue("background-color");
		const foreground = style.getPropertyValue("color");
		colorCell.lastChild.textContent = selectColor(
			colorCell.classList,
			background,
			foreground
		);
		const contrastCell = colorCell.nextElementSibling;
		const contrast = getContrast(background, foreground);
		const scaled = scaleContrast(contrast);
		const percentage = toPercentage(scaled);
		contrastCell.lastChild.textContent = `${percentage}%`;
	}
};

window.addEventListener("load", testContrast);
