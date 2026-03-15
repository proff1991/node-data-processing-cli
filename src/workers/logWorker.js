import { parentPort, workerData } from "node:worker_threads";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

var total = 0;
var levels = {};
var status = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
var paths = {};
var responseSum = 0;

var rl = createInterface({
    input: createReadStream(workerData.file, {
        start: workerData.start,
        end: workerData.end
    }),
    crlfDelay: Infinity
});

rl.on("line", (line) => {

    var parts = line.split(" ");
    if (parts.length < 7) return;

    var level = parts[1];
    var statusCode = Number(parts[3]);
    var responseTime = Number(parts[4]);
    var path = parts[6];

    ++total;

    levels[level] = (levels[level] ?? 0) + 1;

    var cls = Math.floor(statusCode / 100) + "xx";
    if (status[cls] !== undefined) ++status[cls];

    paths[path] = (paths[path] ?? 0) + 1;

    responseSum += responseTime;

});

rl.on("close", () => {

    parentPort.postMessage({
        total,
        levels,
        status,
        paths,
        responseSum
    });

});