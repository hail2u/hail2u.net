const updateHueOnScroll = () => {
	const updateOnHide = (entries) => {
		if (entries[0].isIntersecting) {
			return;
		}

		/* global updateHue */
		updateHue();
	};

	const elements = document.querySelectorAll("hr, pre, blockquote, :not(li) > ol, :not(li) ul, figure, table, h2 + .metaline");
	const observer = new IntersectionObserver(updateOnHide);

	for (const element of elements) {
		observer.observe(element);
	}
};

updateHueOnScroll();
