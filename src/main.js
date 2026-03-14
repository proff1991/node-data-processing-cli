import os from "os";
import { startRepl } from "./repl.js";

var state = {
    "cwd": os.homedir()
};

var printWelcome = () => {
    console.log("Welcome to Data Processing CLI!");
}

var printCwd = (state) => {
    console.log("You are currently in " + state.cwd);
}

var start = () => {
    printWelcome();
    printCwd(state);
    startRepl(state, printCwd);
}

start();