const removeComment = (comment) => {
	if (comment.text.startsWith("!")) {
		return;
	}

	comment.remove();
};

const removeComments = (root) => {
	root.walkComments(removeComment);
};

export {
	removeComments
};
