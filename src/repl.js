import { createInterface } from "readline";
import { up, cd, ls } from "./navigation.js";
import { tokenize } from "./utils/argParser.js";
import { csvToJson } from "./commands/csvToJson.js";
import { jsonToCsv } from "./commands/jsonToCsv.js";
import { count } from "./commands/count.js";
import { hash } from "./commands/hash.js";
import { hashCompare } from "./commands/hashCompare.js";
import { encrypt } from "./commands/encrypt.js";
import { decrypt } from "./commands/decrypt.js";
import { logStats } from "./commands/logStats.js";

var dispatchCommand = async (command, args, state) => {

    // I hate switch statement, it's the most inconvenient tool in C-like languages
    // console.log({ command, args, state });

    if (command === "up") {
        return up(state);
    } else if (command === "cd") {
        return cd(state, args[0]);
    } else if (command === "ls") {
        return ls(state);
    } else if (command === "csv-to-json") {
        return csvToJson(state, args);
    } else if (command === "json-to-csv") {
        return jsonToCsv(state, args);
    } else if (command === "count") {
        return count(state, args);
    } else if (command === "hash") {
        return hash(state, args);
    } else if (command === "hash-compare") {
        return hashCompare(state, args);
    } else if (command === "encrypt") {
        return encrypt(state, args);
    } else if (command === "decrypt") {
        return decrypt(state, args);
    } else if (command === "log-stats") {
        return logStats(state, args);
    }

    return false;
};

var printThanksBeforeEnd = () => {
    console.log("Thank you for using Data Processing CLI!");
}

var gracefulExit = (rl) => {
    printThanksBeforeEnd();
    rl.close();
    process.exit(0);
}

export var startRepl = async (state, printCwd) => {

    var rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "> "
    });

    rl.prompt();

    rl.on("line", async (line) => {

        var input = String(line).trim();

        if (!input) {
            rl.prompt();
            return;
        }

        var tokens = tokenize(input);
        var command = String(tokens[0] ?? "").toLowerCase();

        if (command === ".exit") {
            gracefulExit(rl);
            return;
        }

        try {

            var handled = await dispatchCommand(command, tokens.slice(1), state);

            if (!handled) {
                console.log("Invalid input");
            } else {
                printCwd(state);
            }

        } catch (err) {

            if (err && (err.message === "INVALID_INPUT" || err.message === "Invalid input")) {
                console.log("Invalid input");
            } else {
                console.log("Operation failed");
            }

        }

        rl.prompt();

    });

    rl.on("SIGINT", () => {
        gracefulExit(rl);
    });

}