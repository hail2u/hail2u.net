const removeComment = (comment) => {
	if (comment.text.startsWith("!")) {
		return;
	}

	comment.remove();
};

export default (root) => {
	root.walkComments(removeComment);
};
