import { readFile, writeFile } from "node:fs/promises";
import { Worker } from "node:worker_threads";
import { cpus } from "node:os";
import { resolve, isAbsolute } from "node:path";

export var logStats = async (state, args) => {

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

    var inputPath = isAbsolute(input)
        ? resolve(input)
        : resolve(state.cwd, input);

    var outputPath = isAbsolute(output)
        ? resolve(output)
        : resolve(state.cwd, output);

    var data;

    try {
        data = await readFile(inputPath, "utf8");
    } catch {
        throw new Error("Operation failed");
    }

    var lines = data.split("\n");

    var cpuCount = cpus().length;
    var chunkSize = Math.ceil(lines.length / cpuCount);

    var workers = [];
    var results = [];

    for (var i = 0; i < cpuCount; i++) {

        var chunk = lines.slice(i * chunkSize, (i + 1) * chunkSize).join("\n");

        if (!chunk) continue;

        workers.push(new Promise((resolveWorker, rejectWorker) => {

            var worker = new Worker(
                new URL("../workers/logWorker.js", import.meta.url),
                { workerData: chunk }
            );

            worker.on("message", resolveWorker);
            worker.on("error", rejectWorker);

        }));

    }

    try {
        results = await Promise.all(workers);
    } catch {
        throw new Error("Operation failed");
    }

    var total = 0;
    var levels = {};
    var status = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
    var paths = {};
    var responseSum = 0;

    results.forEach((r) => {

        total += r.total;
        responseSum += r.responseSum;

        Object.entries(r.levels).forEach(([k, v]) => {
            levels[k] = (levels[k] ?? 0) + v;
        });

        Object.entries(r.status).forEach(([k, v]) => {
            status[k] += v;
        });

        Object.entries(r.paths).forEach(([k, v]) => {
            paths[k] = (paths[k] ?? 0) + v;
        });

    });

    var topPaths = Object.entries(paths)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, count]) => ({ path, count }));

    var avgResponseTimeMs = total ? responseSum / total : 0;

    var result = {
        total,
        levels,
        status,
        topPaths,
        avgResponseTimeMs
    };

    try {
        await writeFile(outputPath, JSON.stringify(result, null, 2));
    } catch {
        throw new Error("Operation failed");
    }

    return true;

};