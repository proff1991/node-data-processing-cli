import { createReadStream, createWriteStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { resolve, isAbsolute } from "node:path";

var parseCsvLine = (line) => {

    var values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);

    values = values.map((field) => {

        field = field.trim();

        if (field.startsWith('"') && field.endsWith('"')) {
            field = field.slice(1, -1);
        }

        field = field.replace(/""/g, '"');

        return field;

    });

    return values;

};

export var csvToJson = async (state, args) => {

    var input = "";
    var output = "";

    args.forEach((arg, index) => {

        if (arg === "--input") {
            input = args[index + 1];
        } else if (arg === "--output") {
            output = args[index + 1];
        }

    });

    if (!input || !output) {
        throw new Error("INVALID INPUT");
    }

    var inputPath = isAbsolute(input) ? resolve(input) : resolve(state.cwd, input);
    var outputPath = isAbsolute(output) ? resolve(output) : resolve(state.cwd, output);

    var headers = null;
    var firstObject = true;
    var buffer = "";

    var transform = new Transform({

        transform(chunk, _, callback) {

            buffer += chunk.toString();

            var lines = buffer.split("\n");
            buffer = lines.pop();

            var result = "";

            lines.forEach((line) => {

                line = line.trim();

                if (!line) {
                    return;
                };

                if (!headers) {

                    headers = line.split(",");
                    result += "[";
                    return;

                }

                var values = parseCsvLine(line);
                var record = {};

                headers.forEach((header, index) => {
                    record[header] = values[index] ?? "";
                });

                var json = JSON.stringify(record);

                if (!firstObject) {
                    result += ",";
                }

                result += json;
                firstObject = false;

            });

            callback(null, result);

        },

        flush(callback) {

            var result = "";

            if (buffer && headers) {

                var values = buffer.split(",");
                var obj = {};

                headers.forEach((header, index) => {
                    obj[header] = values[index] ?? "";
                });

                var json = JSON.stringify(obj);

                if (!firstObject) {
                    result += ",";
                }

                result += json;

            }

            result += "]";

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
        throw new Error("OPERATION_FAILED");
    }

    return true;

};