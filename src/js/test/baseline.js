const testBaseline_toggleRel = (link) => {
	if (link.hasAttribute("rel")) {
		link.removeAttribute("rel");
		return;
	}

	link.setAttribute("rel", "stylesheet");
};

const testBaseline = () => {
	document
		.querySelectorAll(".js-test-baseline")
		.forEach(testBaseline_toggleRel);
};

document
	.querySelector(".js-test-baseline-button")
	.addEventListener("click", testBaseline);
