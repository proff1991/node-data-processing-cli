import { stat, readdir } from "node:fs/promises";
import { dirname, resolve, isAbsolute } from "path";
import { compareNames } from "./service.js";

export var up = async (state) => {

    var parent = dirname(state.cwd);

    if (parent !== state.cwd) {
        state.cwd = parent;
    }

    return true;
};


export var cd = async (state, target) => {

    if (!target) {
        throw new Error("INVALID_INPUT");
    }

    var newPath = isAbsolute(target)
        ? target
        : resolve(state.cwd, target);

    try {
        var info = await stat(newPath);
    } catch {
        throw new Error("OPERATION_FAILED");
    }

    if (!info.isDirectory()) {
        throw new Error("OPERATION_FAILED");
    }

    state.cwd = newPath;

    return true;
};


export var ls = async (state) => {

    var entries;

    try {
        entries = await readdir(state.cwd, { withFileTypes: true });
    } catch {
        throw new Error("OPERATION_FAILED");
    }

    var folders = [];
    var files = [];

    entries.forEach((entry) => {

        if (entry.isDirectory()) {
            folders.push(entry.name);
        } else {
            files.push(entry.name);
        }

    });

    folders.sort(compareNames);

    files.sort(compareNames);

    folders.forEach((name) => {
        console.log(name + " [folder]");
    });

    files.forEach((name) => {
        console.log(name + " [file]");
    });

    return true;
};