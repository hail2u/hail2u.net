(() => {
	const append = ({ target }) => {
		const template = document.querySelector(".js-append-next");
		const button = template.content.querySelector("button");

		if (button) {
			button.addEventListener("click", append);
		}

		template.parentNode.insertBefore(template.content, template);
		template.parentNode.removeChild(template);
		target.parentNode.hidden = true;
	};

	append({
		target: document.querySelector(".js-append-next-fallback p"),
	});
})();
