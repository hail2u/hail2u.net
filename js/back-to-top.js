const removeHashTop = () => {
	if (location.hash === "#top") {
		history.replaceState(null, "", `${location.pathname}${location.search}`);
	}
};

window.addEventListener("hashchange", removeHashTop);
