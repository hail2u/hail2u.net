import postcss from "postcss";

const addNode = (supports, node) => {
	supports.first.append(node);
};

const wrapWithSupports = (root) => {
	const supports = postcss.parse("@supports (--custom-property: true) {}");
	root.each(addNode.bind(null, supports));
	root.append(supports);
};

export {
	wrapWithSupports
};
