import { Surreal, nodeRequest, nodeResponse, routeFunction } from "./methods";

async function use(
    req: nodeRequest,
    res: nodeResponse,
    func: routeFunction,
    db: Surreal
) {
    try {
        let body = {};
        let headers = req.headers;
        req.on("error", (err: Error) => {
            console.log(err);
        })
            .on("data", async (data: any) => {
                body = JSON.parse(data);
            })
            .on("end", async () => {
                res.on("error", (err) => {
                    console.error(err);
                });
                const msg = await func(body, headers, db);
                if (msg instanceof Error) {
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    res.end(JSON.stringify(msg.message));
                    return;
                }
                res.end(JSON.stringify(msg));
            });
    } catch (e: any) {
        res.statusCode = 400;
        res.end(e.message);
    }
}

export { use };
