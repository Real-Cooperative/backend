import { Surreal, nodeRequest, nodeResponse, routeFunction } from "./methods";

async function use(
    req: nodeRequest,
    res: nodeResponse,
    func: routeFunction,
    db: Surreal
) {
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
            res.end(JSON.stringify(msg));
        });
}

export { use };
