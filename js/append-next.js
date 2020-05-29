const showNext = ({
	target
}) => {
	const template = document.querySelector(".js-append-next");
	const button = template.content.querySelector("button");

	if (button) {
		button.addEventListener("click", showNext);
	}

	template.parentNode.insertBefore(template.content, template);
	template.parentNode.removeChild(template);
	target.parentNode.hidden = true;
};

showNext({
	"target": document.querySelector(".js-append-next-fallback p")
});
