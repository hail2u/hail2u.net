const swapRandomly = (elm, i, arr) => {
	const j = Math.floor(Math.random() * (i + 1));

	if (i === j) {
		return;
	}

	[arr[i], arr[j]] = [arr[j], arr[i]];
};

const shuffleArray = (array) => {
	const shuffled = [...array];
	shuffled.forEach(swapRandomly);
	return shuffled;
};

export { shuffleArray };
