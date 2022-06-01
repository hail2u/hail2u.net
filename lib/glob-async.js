import glob from "glob";
import { promisify } from "util";

const globAsync = promisify(glob);

export { globAsync };
