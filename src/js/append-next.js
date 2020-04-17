const showNext = (event) => {
	const template = document.querySelector(".js-append-next");
	const button = template.content.querySelector("button");

	if (button) {
		button.addEventListener("click", showNext);
	}

	template.parentNode.insertBefore(template.content, template);
	template.remove();
	const self = event.target;
	self.parentNode.hidden = true;
};

showNext({
	target: document.querySelector(".js-append-next-fallback a")
});
