const headingAnchors = () => {
	const articles = document.querySelectorAll('[itemprop="articleBody"]');

	for (const article of articles) {
		const headings = article.querySelectorAll("h2, h3, h4, h5, h6");

		for (const heading of headings) {
			const section = heading.parentElement;
			const id = encodeURIComponent(heading.textContent)
				.replace(/%/gu, "")
				.substr(0, 16);
			section.id = id;
			const anchor = document.createElement("a");
			anchor.href = `#${id}`;
			anchor.ariaHidden = true;
			anchor.append("#");
			heading.append(" ");
			heading.append(anchor);
		}
	}
};

headingAnchors();
