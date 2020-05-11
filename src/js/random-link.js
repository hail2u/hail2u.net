const setRandomLink = () => {
	const links = document.querySelectorAll(".js-random-link-link[href]");
	const link = links[Math.floor(Math.random() * links.length)];
	const href = link.getAttribute("href");
	const template = document.querySelector(".js-random-link");
	template.content.querySelector("a").setAttribute("href", href);
	template.parentNode.insertBefore(template.content, template);
	template.parentNode.removeChild(template);
};

setRandomLink();
