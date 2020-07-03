(() => {
	const mode = localStorage.getItem("color-mode");

	if (mode) {
		document.getElementById(`color-mode-${mode}`).checked = true;
	}

	const elements = document.querySelectorAll(".js-color-mode");

	for (const element of elements) {
		/* global changeColorMode */
		element.addEventListener("change", changeColorMode);
	}
})();
