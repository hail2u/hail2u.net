if (location.search) {
	const search = location.search
		.replace(/[?&]utm_[^&]+/g, "")
		.replace(/^&/, "?");
	history.replaceState(
		null,
		"",
		`${location.pathname}${search}${location.hash}`
	);
}
