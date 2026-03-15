import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createCipheriv, randomBytes, scryptSync } from "node:crypto";
import { resolve, isAbsolute } from "node:path";

export var encrypt = async (state, args) => {

    var input = "";
    var output = "";
    var password = "";

    args.forEach((arg, index) => {

        if (arg === "--input") {
            input = args[index + 1];
        }

        if (arg === "--output") {
            output = args[index + 1];
        }

        if (arg === "--password") {
            password = args[index + 1];
        }

    });

    if (!input || !output || !password) {
        throw new Error("Invalid input");
    }

    var inputPath = isAbsolute(input)
        ? resolve(input)
        : resolve(state.cwd, input);

    var outputPath = isAbsolute(output)
        ? resolve(output)
        : resolve(state.cwd, output);

    var salt = randomBytes(16);
    var iv = randomBytes(12);

    var key = scryptSync(password, salt, 32);

    var cipher = createCipheriv("aes-256-gcm", key, iv);

    var inputStream = createReadStream(inputPath);
    var outputStream = createWriteStream(outputPath);

    try {

        outputStream.write(salt);
        outputStream.write(iv);

        await pipeline(
            inputStream,
            cipher,
            outputStream
        );

    } catch {
        throw new Error("Operation failed");
    }

    var authTag = cipher.getAuthTag();

    try {

        var tagStream = createWriteStream(outputPath, { flags: "a" });
        tagStream.write(authTag);
        tagStream.end();

    } catch {
        throw new Error("Operation failed");
    }

    return true;

};