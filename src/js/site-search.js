const showSiteSearchForm = () => {
	const doSearch = (event) => {
		const query = event.srcElement.q;
		query.value = `${query.value} site:hail2u.net`;
	};

	const template = document.querySelector(".js-site-search");
	template.content
		.querySelector(".js-site-search-form")
		.addEventListener("submit", doSearch);
	template.parentNode.insertBefore(template.content, template);
	template.parentNode.removeChild(template);
	const fallback = document.querySelector(".js-site-search-fallback");
	fallback.textContent = fallback.dataset.normal;
};

showSiteSearchForm();
