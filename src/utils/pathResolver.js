import { resolve, isAbsolute } from "node:path";

export var resolvePath = (target, state) => {
    return isAbsolute(target)
        ? target
        : resolve(state.cwd, target)
};