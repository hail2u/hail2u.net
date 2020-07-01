/* global updateHue */

const updateHueOnScroll = () => {
	const observe = (observer, element) => {
		observer.observe(element);
	};

	const observer = new IntersectionObserver(updateHue);
	document.querySelectorAll("hr, pre, blockquote, ol, ul, figure, table")
		.forEach(observe.bind(null, observer));
};

window.addEventListener("DOMContentLoaded", updateHueOnScroll);
