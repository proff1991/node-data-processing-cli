import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import { resolve, isAbsolute } from "node:path";

export var hashCompare = async (state, args) => {

    var input = "";
    var hashFile = "";
    var algorithm = "sha256";

    args.forEach((arg, index) => {

        if (arg === "--input") {
            input = args[index + 1];
        }

        if (arg === "--hash") {
            hashFile = args[index + 1];
        }

        if (arg === "--algorithm") {
            algorithm = args[index + 1];
        }

    });

    if (!input || !hashFile) {
        throw new Error("Invalid input");
    }

    if (algorithm !== "sha256" && algorithm !== "md5" && algorithm !== "sha512") {
        throw new Error("Operation failed");
    }

    var inputPath = isAbsolute(input)
        ? resolve(input)
        : resolve(state.cwd, input);

    var hashPath = isAbsolute(hashFile)
        ? resolve(hashFile)
        : resolve(state.cwd, hashFile);

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

    var calculatedHash = hashInstance.digest("hex");

    var expectedHash = "";

    try {

        expectedHash = await readFile(hashPath, "utf8");

    } catch {
        throw new Error("Operation failed");
    }

    expectedHash = expectedHash.trim().toLowerCase();
    calculatedHash = calculatedHash.toLowerCase();

    if (expectedHash === calculatedHash) {
        console.log("OK");
    } else {
        console.log("MISMATCH");
    }

    return true;

};