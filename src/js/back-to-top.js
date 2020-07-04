(() => {
	const remove = () => {
		if (location.hash === "#top") {
			history.replaceState(null, "", `${location.pathname}${location.search}`);
		}
	};

	window.addEventListener("hashchange", remove);
})();
