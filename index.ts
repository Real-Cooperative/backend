import * as app from "http";

import { Surreal } from "surrealdb.js";
import { externalRequest as post } from "./routes/post";
import { externalRequest as get } from "./routes/get";
import { getMe, getUser, login, signup, updateUser } from "./routes/user";
import { delRecord } from "./routes/delete";
import { use } from "./methods/use";
import { getRelation } from "./routes/getRelation";

import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 4000;
const whiteList = process.env.WHITE_LIST || "http://localhost:3000";

const db = new Surreal(process.env.SURREAL_DB || "http://localhost:8000/rpc");

type nodeRequest = app.IncomingMessage;
type nodeResponse = app.ServerResponse<app.IncomingMessage> & {
    req: app.IncomingMessage;
};

const routes = {
    "/api/v1/login": (req: nodeRequest, res: nodeResponse) =>
        use(req, res, login, db),

    "/api/v1/signup": (req: nodeRequest, res: nodeResponse) =>
        use(req, res, signup, db),

    "/api/v1/me": (req: nodeRequest, res: nodeResponse) =>
        use(req, res, getMe, db),

    "/api/v1/user": (req: nodeRequest, res: nodeResponse) =>
        use(req, res, getUser, db),

    "/api/v1/update-user": (req: nodeRequest, res: nodeResponse) =>
        use(req, res, updateUser, db),

    "/api/v1/post": (req: nodeRequest, res: nodeResponse) =>
        use(req, res, post, db),

    "/api/v1/get": (req: nodeRequest, res: nodeResponse) =>
        use(req, res, get, db),

    "/api/v1/get-relation": (req: nodeRequest, res: nodeResponse) =>
        use(req, res, getRelation, db),

    "/api/v1/delete": (req: nodeRequest, res: nodeResponse) =>
        use(req, res, delRecord, db),

    "/": (req: nodeRequest, res: nodeResponse) => {
        res.writeHead(200);
        res.end("OK");
    },
};

const server = app.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", whiteList);

    res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", 86400);
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Authentication, X-RCIAD-Requested-ID, x-rciad-requested-user, x-rciad-page, x-rciad-limit, x-rciad-requested-relation, x-rciad-subscribed"
    );

    if (req.url && req.url in routes) {
        return routes[req.url as keyof typeof routes](req, res);
    } else {
        res.statusCode = 404;
        res.end("Route Not Found");
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

server.on("error", (err) => {
    console.error(err);
});
