(() => {
	const get = () => {
		const mode = localStorage.getItem("color-mode");

		if (mode === null) {
			return "auto";
		}

		return mode;
	};

	const change = (mode) => {
		localStorage.setItem("color-mode", mode);
		const rootClass = document.documentElement.classList;

		if (mode === "dark") {
			rootClass.add("js-color-mode-dark");
			rootClass.remove("js-color-mode-light");
			return;
		}

		if (mode === "light") {
			rootClass.add("js-color-mode-light");
			rootClass.remove("js-color-mode-dark");
			return;
		}

		rootClass.remove("js-color-mode-dark", "js-color-mode-light");
		localStorage.removeItem("color-mode");
	};

	window.changeColorMode = change;
	change(get());
})();
