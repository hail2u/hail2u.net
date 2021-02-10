const testColumn = () => {
	document.body.classList.toggle("js-test-column");
};

document
	.querySelector(".js-test-column-button")
	.addEventListener("click", testColumn);
