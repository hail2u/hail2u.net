(function () {
	"use strict";

	var backToTop = function backToTop() {
		if (location.hash === "#top") {
			history.replaceState(
				null,
				"",
				"".concat(location.pathname).concat(location.search)
			);
		}
	};

	window.addEventListener("hashchange", backToTop);
})();
