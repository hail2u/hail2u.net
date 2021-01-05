(function () {
	"use strict";

	var unutm = function unutm() {
		if (location.search) {
			var search = location.search
				.replace(
					/[&\?]utm_(?:[\0-%'-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+/g,
					""
				)
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
