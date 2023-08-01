import http from "http";
import https from "https";
const app = process.env.NODE_ENV === "development" ? http : https;

import cluster from "cluster";
import os from "os";

import url from "url";
import fs from "fs";
import path from "path";

import { Surreal } from "surrealdb.js";
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

const db = new Surreal(process.env.SURREAL_DB || "http://localhost:8000/rpc");

// if (cluster.isPrimary) {
//     let numWorkers = os.cpus().length || 2;
//     console.log(`Master is setting up ${numWorkers} workers`);

//     for (let i = 0; i < numWorkers; i++) {
//         cluster.fork();
//     }

//     cluster.on("online", (worker) => {
//         console.log(`Worker ${worker.process.pid} is online`);
//     });

//     cluster.on("exit", (worker, code, signal) => {
//         console.log(
//             `Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`
//         );
//         console.log("Starting a new worker");
//         cluster.fork();
//     });
// } else {
const routes = {
    "/api/v1/login": (req, res) => use(req, res, login, db),
    "/api/v1/signup": (req, res) => use(req, res, signup, db),
    "/api/v1/me": (req, res) => use(req, res, getMe, db),
    "/api/v1/user": (req, res) => use(req, res, getUser, db),
    "/api/v1/update-user": (req, res) => use(req, res, updateUser, db),
    "/api/v1/post": (req, res) => use(req, res, post, db),
    "/api/v1/get": (req, res) => use(req, res, get, db),
    "/api/v1/get-relation": (req, res) => use(req, res, getRelation, db),
    "/api/v1/delete": (req, res) => use(req, res, delRecord, db),
    "/api/v1/upload": (req, res) => upload(req, res),
    "/": (req, res) => {
        res.writeHead(200);
        res.end("OK");
    },
};

const server = app.createServer(async (req, res) => {
    res.setHeader(
        "Access-Control-Allow-Origin",
        process.env.WHITE_LISTED_DOMAIN
    );

    res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, PATCH");
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
            if (fs.statSync(pathname).isDirectory()) pathname += "/index" + ext;

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

server.on("error", (err) => {
    console.error(err);
});

// }
