(() => {
	const init = () => {
		const elements = document.querySelectorAll("hr, pre, blockquote, :not(li) > ol, :not(li) ul, figure, table, h2 + .metaline");
		/* global changeHue */
		const observer = new IntersectionObserver(changeHue);

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
