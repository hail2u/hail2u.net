const setRandomLink = () => {
	const links = document.querySelectorAll(".js-random-link-link[href]");
	document.querySelector(".js-random-link")
		.setAttribute("href", links[Math.floor(Math.random() * links.length)].getAttribute("href"));
};

setRandomLink();
