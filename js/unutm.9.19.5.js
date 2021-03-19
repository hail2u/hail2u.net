(function () {
	"use strict";

	var unutm = function unutm() {
		if (location.search) {
			var search = location.search
				.replace(/[&\?]utm_(?:(?!&)[\s\S])+/g, "")
				.replace(/^&/, "?");
			history.replaceState(
				null,
				"",
				"".concat(location.pathname).concat(search).concat(location.hash)
			);
		}
	};

	unutm();
})();
