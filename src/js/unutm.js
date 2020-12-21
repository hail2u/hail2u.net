(() => {
	if (location.search) {
		const search = location.search
			.replace(/[?&]utm_[^&]+/gu, "")
			.replace(/^&/u, "?");
		history.replaceState(
			null,
			"",
			`${location.pathname}${search}${location.hash}`
		);
	}
})();
