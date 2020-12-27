const toggleRel = (element) => {
	if (element.hasAttribute("rel")) {
		element.removeAttribute("rel");
		return;
	}

	element.setAttribute("rel", "stylesheet");
};

const testBaseline = () => {
	document.querySelectorAll(".js-test-baseline").forEach(toggleRel);
};

document
	.querySelector(".js-test-baseline-button")
	.addEventListener("click", testBaseline);
