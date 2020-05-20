import path from "path";

const reWin32Sep = new RegExp(`\\${path.win32.sep}`, "g");

const convertToPOSIXPath = (filepath) => {
	if (path.sep === path.posix.sep) {
		return filepath;
	}

	return filepath.replace(reWin32Sep, path.posix.sep);
};

export {
	convertToPOSIXPath
};
