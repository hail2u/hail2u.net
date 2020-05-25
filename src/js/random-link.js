const setRandomLink = () => {
	const links = document.querySelectorAll(".js-random-link-link[href]");
	const link = links[Math.floor(Math.random() * links.length)];
	const href = link.getAttribute("href");
	const template = document.querySelector(".js-random-link");
	template.content.querySelector("a").setAttribute("href", href);
	const fallback = document.querySelector(".js-random-link-fallback");
	template.parentNode.replaceChild(template.content, fallback);
	template.parentNode.removeChild(template);
};

setRandomLink();
