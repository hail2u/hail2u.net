(() => {
	const toggle = () => {
		document.body.classList.toggle("js-test-column");
		document.body.classList.toggle("js-test-element");
	};

	const init = () => {
		document.querySelector(".js-test-column-and-element-button").addEventListener("click", toggle);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
		return;
	}

	init();
})();
