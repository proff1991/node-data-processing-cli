import { createInterface } from "readline"

var dispatchCommand = async () => {
    // placeholder
    return false;
}

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

        var tokens = input.split(/\s+/);
        var command = String(tokens[0]).toLowerCase();

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

            if (err && err.message === "INVALID_INPUT") {
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