const setRandomLink = () => {
	const links = document.querySelectorAll(".js-random-link-link[href]");
	const link = links[Math.floor(Math.random() * links.length)];
	const href = link.getAttribute("href");
	document.querySelector(".js-random-link").setAttribute("href", href);
};

setRandomLink();
