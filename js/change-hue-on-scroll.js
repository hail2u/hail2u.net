(() => {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		return;
	}

	let previous = 0;

	const change = (entries) => {
		const [{
			time: now
		}] = entries;

		if (entries[0].isIntersecting || now < previous + 2000) {
			return;
		}

		previous = now;
		/* global changeHue */
		changeHue();
	};

	const init = () => {
		const elements = document.querySelectorAll("hr, pre, blockquote, :not(li) > ol, :not(li) ul, figure, table, h2 + .metaline");
		const observer = new IntersectionObserver(change);

		for (const element of elements) {
			observer.observe(element);
		}
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
		return;
	}

	init();
})();
