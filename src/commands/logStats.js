import { stat, open, writeFile } from "node:fs/promises";
import { Worker } from "node:worker_threads";
import { cpus } from "node:os";
import { resolve, isAbsolute } from "node:path";

export var logStats = async (state, args) => {

    var input = "";
    var output = "";

    args.forEach((arg, i) => {
        if (arg === "--input") input = args[i + 1];
        if (arg === "--output") output = args[i + 1];
    });

    if (!input || !output) {
        throw new Error("Invalid input");
    }

    var inputPath = isAbsolute(input) ? resolve(input) : resolve(state.cwd, input);
    var outputPath = isAbsolute(output) ? resolve(output) : resolve(state.cwd, output);

    var fileStat = await stat(inputPath);
    var fileSize = fileStat.size;

    var cpuCount = cpus().length;
    var approxChunk = Math.ceil(fileSize / cpuCount);

    var fd = await open(inputPath, "r");

    var chunks = [];
    var start = 0;

    for (var i = 0; i < cpuCount; ++i) {

        var end = Math.min(start + approxChunk, fileSize - 1);

        if (end < fileSize - 1) {

            var buffer = Buffer.alloc(1);

            while (true) {
                var { bytesRead } = await fd.read(buffer, 0, 1, end);

                if (!bytesRead || buffer[0] === 10) {
                    break;
                }

                ++end;
            }

        }

        chunks.push({ start, end });

        start = end + 1;

        if (start >= fileSize) {
            break;
        }
    }

    await fd.close();

    var workers = chunks.map((chunk) => {

        return new Promise((resolveWorker, rejectWorker) => {

            var worker = new Worker(
                new URL("../workers/logWorker.js", import.meta.url),
                {
                    workerData: {
                        file: inputPath,
                        start: chunk.start,
                        end: chunk.end
                    }
                }
            );

            worker.on("message", resolveWorker);
            worker.on("error", rejectWorker);

        });

    });

    var results = await Promise.all(workers);

    var total = 0;
    var levels = {};
    var status = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
    var paths = {};
    var responseSum = 0;

    results.forEach((r) => {

        total += r.total;
        responseSum += r.responseSum;



        Object.entries(r.levels).forEach(({ 0: level, 1: count }) => {
            levels[level] = (levels[level] ?? 0) + count;
        });

        Object.entries(r.status).forEach(({ 0: statusClass, 1: count }) => {
            status[statusClass] += count;
        });

        Object.entries(r.paths).forEach(({ 0: path, 1: count }) => {
            paths[path] = (paths[path] ?? 0) + count;
        });

    });

    var topPaths = Object.entries(paths)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(({ 0: path, 1: count }) => ({ path, count }));

    var result = {
        total,
        levels,
        status,
        topPaths,
        avgResponseTimeMs: total ? responseSum / total : 0
    };

    await writeFile(outputPath, JSON.stringify(result, null, 2));

    return true;
};