(() => {
	const change = (event) => {
		/* global changeColorMode */
		changeColorMode(event.srcElement.value);
	};

	const init = () => {
		const mode = localStorage.getItem("color-mode");

		if (mode) {
			document.getElementById(`color-mode-${mode}`).checked = true;
		}

		const elements = document.querySelectorAll(".js-color-mode");

		for (const element of elements) {
			element.addEventListener("change", change);
		}
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
		return;
	}

	init();
})();
