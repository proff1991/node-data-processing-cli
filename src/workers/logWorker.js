import { parentPort, workerData } from "node:worker_threads";

var lines = workerData.split("\n");

var total = 0;
var levels = {};
var status = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
var paths = {};
var responseSum = 0;

lines.forEach((line) => {

    line = line.trim();
    if (!line) {
        return;
    }

    var parts = line.split(" ");

    var level = parts[1];
    var statusCode = Number(parts[3]);
    var responseTime = Number(parts[4]);
    var path = parts[6];

    ++total;

    levels[level] = (levels[level] ?? 0) + 1;

    var statusClass = Math.floor(statusCode / 100) + "xx";

    if (status[statusClass] !== undefined) {
        ++status[statusClass];
    }

    paths[path] = (paths[path] ?? 0) + 1;

    responseSum += responseTime;

});

parentPort.postMessage({
    total,
    levels,
    status,
    paths,
    responseSum
});