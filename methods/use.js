async function use(req, res, func) {
    let body = {};
    req.on("error", (err) => {
        console.log(err);
    })
        .on("data", async (data) => {
            body = JSON.parse(data);
        })
        .on("end", async () => {
            res.on("error", (err) => {
                console.error(err);
            });
            const msg = await func(body);
            res.end(JSON.stringify(msg));
        });
}

export { use };