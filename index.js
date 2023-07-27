import http from "http";
import https from "https";
const app = process.env.NODE_ENV === "development" ? http : https;

import cluster from "cluster";
import os from "os";

import url from "url";
import fs from "fs";
import path from "path";
import { externalRequest as post } from "./routes/post.js";
import { externalRequest as get } from "./routes/get.js";
import { getMe, getUser, login, signup, updateUser } from "./routes/user.js";
import { upload } from "./routes/upload.js";
import { delRecord } from "./routes/delete.js";
import { use } from "./methods/use.js";
import { getRelation } from "./routes/getRelation.js";

import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 4000;

if (cluster.isPrimary) {
    let numWorkers = os.cpus().length || 2;
    console.log(`Master is setting up ${numWorkers} workers`);

    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on("online", (worker) => {
        console.log(`Worker ${worker.process.pid} is online`);
    });

    cluster.on("exit", (worker, code, signal) => {
        console.log(
            `Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`
        );
        console.log("Starting a new worker");
        cluster.fork();
    });
} else {
    const routes = {
        "/login": (req, res) => use(req, res, login),
        "/signup": (req, res) => use(req, res, signup),
        "/me": (req, res) => use(req, res, getMe),
        "/user": (req, res) => use(req, res, getUser),
        "/update-user": (req, res) => use(req, res, updateUser),
        "/post": (req, res) => use(req, res, post),
        "/get": (req, res) => use(req, res, get),
        "/get-relation": (req, res) => use(req, res, getRelation),
        "/delete": (req, res) => use(req, res, delRecord),
        "/upload": (req, res) => upload(req, res),
        "/health": (req, res) => {
            res.writeHead(200);
            res.end("OK");
        },
    };

    const server = app.createServer(async (req, res) => {
        res.setHeader(
            "Access-Control-Allow-Origin",
            process.env.WHITE_LISTED_DOMAIN
        );

        res.setHeader(
            "Access-Control-Allow-Methods",
            "POST, GET, DELETE, PATCH"
        );
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Access-Control-Max-Age", 86400);
        res.setHeader(
            "Access-Control-Allow-Headers",
            "Authentication, X-RCIAD-Requested-ID, x-rciad-requested-user, x-rciad-page, x-rciad-limit, x-rciad-requested-relation, x-rciad-subscribed"
        );

        if (req.url in routes) {
            return routes[req.url](req, res);
        } else {
            const parsedUrl = url.parse(req.url);
            // extract URL path
            let pathname = `.${parsedUrl.pathname}`;
            // based on the URL path, extract the file extension. e.g. .js, .doc, ...
            const ext = path.parse(pathname).ext;
            // maps file extension to MIME typere
            const map = {
                ".ico": "image/x-icon",
                ".html": "text/html",
                ".js": "text/javascript",
                ".json": "application/json",
                ".css": "text/css",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".wav": "audio/wav",
                ".mp3": "audio/mpeg",
                ".svg": "image/svg+xml",
                ".pdf": "application/pdf",
                ".doc": "application/msword",
            };

            fs.stat(pathname, function (err, exist) {
                if (err) {
                    // if the file is not found, return 404
                    res.statusCode = 404;
                    res.end(`File ${pathname} not found!`);
                    return;
                }

                // if is a directory search for index file matching the extension
                if (fs.statSync(pathname).isDirectory())
                    pathname += "/index" + ext;

                // read file from file system
                fs.readFile(pathname, function (err, data) {
                    if (err) {
                        res.statusCode = 500;
                        res.end(`Error getting the file: ${err}.`);
                    } else {
                        // if the file is found, set Content-type and send data
                        res.setHeader("Content-type", map[ext] || "text/plain");
                        res.end(data);
                    }
                });
            });
        }
    });

    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}
