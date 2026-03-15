import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import { resolve, isAbsolute } from "node:path";

export var count = async (state, args) => {

    var input = "";

    args.forEach((arg, index) => {

        if (arg === "--input") {
            input = args[index + 1];
        }

    });

    if (!input) {
        throw new Error("Invalid input");
    }

    var inputPath = isAbsolute(input) ? resolve(input) : resolve(state.cwd, input);

    var lines = 0;
    var words = 0;
    var characters = 0;

    var leftover = "";
    var hasData = false;

    var transform = new Transform({

        transform(chunk, _, callback) {

            var text = chunk.toString();

            if (text.length > 0) {
                hasData = true;
            }

            characters += text.length;

            for (var i = 0; i < text.length; ++i) {
                if (text[i] === "\n") {
                    ++lines;
                }
            }

            text = leftover + text;

            var parts = text.split(/\s+/);

            leftover = parts.pop();

            words += parts.filter(Boolean).length;

            callback();

        },

        flush(callback) {

            if (leftover.trim()) {
                words += 1;
            }

            if (hasData) {
                lines += 1;
            }

            callback();

        }

    });

    try {

        await pipeline(
            createReadStream(inputPath),
            transform
        );

    } catch {
        throw new Error("Operation failed");
    }

    console.log("Lines: " + lines);
    console.log("Words: " + words);
    console.log("Characters: " + characters);

    return true;

};