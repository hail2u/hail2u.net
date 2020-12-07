const shuffleArray = (array) => {
	const shuffled = [...array];

	for (let i = array.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));

		if (i === j) {
			continue;
		}

		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled;
};

export { shuffleArray };
