import { createReadStream, createWriteStream } from "node:fs";
import { open } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { createDecipheriv, scryptSync } from "node:crypto";
import { resolve, isAbsolute } from "node:path";

export var decrypt = async (state, args) => {

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

    try {

        var file = await open(inputPath, "r");

    } catch {
        throw new Error("Operation failed");
    }

    var stat = await file.stat();
    var size = stat.size;

    if (size < 44) {
        throw new Error("Operation failed");
    }

    var header = Buffer.alloc(28);
    await file.read(header, 0, 28, 0);

    var salt = header.subarray(0, 16);
    var iv = header.subarray(16, 28);

    var authTag = Buffer.alloc(16);
    await file.read(authTag, 0, 16, size - 16);

    await file.close();

    var key = scryptSync(password, salt, 32);

    var decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    var inputStream = createReadStream(inputPath, {
        start: 28,
        end: size - 17
    });

    var outputStream = createWriteStream(outputPath);

    try {

        await pipeline(
            inputStream,
            decipher,
            outputStream
        );

    } catch {
        throw new Error("Operation failed");
    }

    return true;

};