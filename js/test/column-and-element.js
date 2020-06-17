const testColumnAndElement = () => {
	document.body.classList.toggle("js-test-column");
	document.body.classList.toggle("js-test-element");
};

document.querySelector(".js-test-column-and-element-button")
	.addEventListener("click", testColumnAndElement);
