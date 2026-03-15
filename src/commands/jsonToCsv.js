import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { resolve, isAbsolute } from "node:path";
import { Transform } from "node:stream";


export var jsonToCsv = async (state, args) => {

    var input = "";
    var output = "";

    args.forEach((arg, index) => {

        if (arg === "--input") {
            input = args[index + 1];
        }

        if (arg === "--output") {
            output = args[index + 1];
        }

    });

    if (!input || !output) {
        throw new Error("Invalid input");
    }

    var inputPath = isAbsolute(input) ? resolve(input) : resolve(state.cwd, input);
    var outputPath = isAbsolute(output) ? resolve(output) : resolve(state.cwd, output);

    var jsonBuffer = "";

    var transform = new Transform({

        transform(chunk, _, callback) {
            jsonBuffer += chunk.toString();
            callback();
        },

        flush(callback) {

            var data;

            try {
                data = JSON.parse(jsonBuffer);
            } catch {
                callback(new Error("INVALID_JSON"));
                return;
            }

            if (!Array.isArray(data) || data.length === 0) {
                callback(null, "");
                return;
            }

            var headers = Object.keys(data[0]);

            var result = "";

            result += headers.join(",") + "\n";

            data.forEach((row) => {

                var values = headers.map((key) => {

                    var value = row[key] ?? "";

                    value = String(value);

                    if (value.includes('"')) {
                        value = value.replace(/"/g, '""');
                    }

                    if (value.includes(",") || value.includes('"')) {
                        value = '"' + value + '"';
                    }

                    return value;

                });

                result += values.join(",") + "\n";

            });

            callback(null, result);

        }

    });

    try {

        await pipeline(
            createReadStream(inputPath),
            transform,
            createWriteStream(outputPath)
        );

    } catch {
        throw new Error("Operation failed");
    }

    return true;

};