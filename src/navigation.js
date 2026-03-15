import { stat, readdir } from "node:fs/promises";
import { dirname } from "node:path";
import { resolvePath } from "./utils/pathResolver.js";

export var up = async (state) => {

    var parent = dirname(state.cwd);

    if (parent !== state.cwd) {
        state.cwd = parent;
    }

    return true;
};

var compareNames = (a, b) => {
    return String(a).localeCompare(String(b));
};

export var cd = async (state, target) => {

    if (!target) {
        throw new Error("Invalid input");
    }

    var newPath = resolvePath(target,state);

    try {
        var info = await stat(newPath);
    } catch {
        throw new Error("Operation failed");
    }

    if (!info.isDirectory()) {
        throw new Error("Operation failed");
    }

    state.cwd = newPath;

    return true;
};


export var ls = async (state) => {

    var entries;

    try {
        entries = await readdir(state.cwd, { withFileTypes: true });
    } catch {
        throw new Error("Operation failed");
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