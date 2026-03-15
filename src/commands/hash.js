import { createReadStream, createWriteStream } from "node:fs";
import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Transform, Readable } from "node:stream";
import { resolve, isAbsolute } from "node:path";

export var hash = async (state, args) => {

    var input = "";
    var algorithm = "sha256";
    var save = false;

    args.forEach((arg, index) => {

        if (arg === "--input") {
            input = args[index + 1];
        }

        if (arg === "--algorithm") {
            algorithm = args[index + 1];
        }

        if (arg === "--save") {
            save = true;
        }

    });

    if (!input) {
        throw new Error("Invalid input");
    }

    if (algorithm !== "sha256" && algorithm !== "md5" && algorithm !== "sha512") {
        throw new Error("Operation failed");
    }

    var inputPath = isAbsolute(input)
        ? resolve(input)
        : resolve(state.cwd, input);

    var hashInstance = createHash(algorithm);

    var transform = new Transform({

        transform(chunk, _, callback) {

            hashInstance.update(chunk);
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

    var digest = hashInstance.digest("hex");

    console.log(algorithm + ": " + digest);

    if (save) {

        var outputPath = inputPath + "." + algorithm;

        try {

            await pipeline(
                Readable.from([digest + "\n"]),
                createWriteStream(outputPath)
            );

        } catch {
            throw new Error("Operation failed");
        }

    }

    return true;

};