import Surreal from "surrealdb.js";

const db = new Surreal("http://127.0.0.1:8000/rpc");

const externalRequest = async (body) => {
    try {
        let id = `${body.type.replaceAll(" ", "_")}:${body.name.replaceAll(
            " ",
            "_"
        )}`;
        await db.signin({ user: "root", pass: "root" });
        await db.use({ ns: "test", db: "test" });
        if (await db.select(id)) {
            id = `${id}_${Date.now()}`;
        }

        for (let property in body) {
            if (Array.isArray(body[property])) await arrayLoop(property);
            else if (typeof body[property] === "object")
                await relateObj(body[property]);
        }

        await db.create(id, body);
        return { message: "Success", id };

        async function arrayLoop(property) {
            for (let obj of body[property]) {
                await relateObj(obj);
            }
        }

        async function relateObj(obj) {
            if (!obj.type || !obj.name) return;
            let objID = `${obj.type.replaceAll(" ", "_")}:${obj.name.replaceAll(
                " ",
                "_"
            )}`;
            obj.id = objID;
            const objData = await db.select(objID);
            if (objData.length === 0) {
                await db.create(objID, { name: obj.name, [body.type]: [id] });
                return;
            }
            objData[body.type].push(id);
            await db.update(objID, objData);
        }
    } catch (e) {
        console.error("ERROR", e);
        return { message: "Error", e: e.message };
    }
};

export { externalRequest };
