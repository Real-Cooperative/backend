import Surreal from "surrealdb.js";
import dotenv from "dotenv";
import { parseJwt } from "../methods/parseJwt.js";

dotenv.config();

const db = new Surreal(process.env.SURREAL_DB || "http://localhost:8000/rpc");

const externalRequest = async (body, headers) => {
    try {
        const { type, name } = body;
        const { authentication } = headers;

        const { ID } = parseJwt(authentication);

        if (!type) throw new Error("type is required");
        if (!name) throw new Error("name is required");

        await db.signin({ user: "root", pass: process.env.SURREAL_PASS });
        await db.use({ ns: "test", db: "test" });

        let id = `${type.replaceAll(" ", "_")}:${name.replaceAll(" ", "_")}`;
        let [idQuery] = await db.select(id);

        body.created_by = ID;
        body.created_at = Date.now();

        if (idQuery) {
            id = `${id}_${Date.now()}`;
        }

        for (let property in body) {
            if (Array.isArray(body[property])) await arrayLoop(property);
            else if (typeof body[property] === "object")
                await relateObj(body[property]);
        }

        //set permissions for newly created tables
        let [tableQuery] = await db.select(type.replaceAll(" ", "_"));
        if (!tableQuery) {
            await db.query(`
             DEFINE TABLE ${type.replaceAll(" ", "_")} SCHEMALESS
                 PERMISSIONS
                 FOR select WHERE true
                 FOR create, update, delete WHERE created_by = $auth.id OR $auth.admin = true;
             `);
        }

        await db.invalidate();
        await db.authenticate(authentication);
        await db.use({ ns: "test", db: "test" });
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

            const [result] = await db.select(objID);

            if (!result) {
                let [tableQuery] = await db.select(
                    obj.type.replaceAll(" ", "_")
                );
                await db.create(objID, { name: obj.name, created_by: ID });
                if (!tableQuery) {
                    await db.query(`
                    DEFINE TABLE ${obj.type.replaceAll(" ", "_")} SCHEMALESS
                        PERMISSIONS
                        FOR select WHERE true
                        FOR create, update, delete WHERE created_by = $auth.id OR $auth.admin = true;
                    `);
                }
            }
            await db.query(`RELATE ${id}->made_of->${objID}`);
        }
    } catch (e) {
        console.error("ERROR", e);
        return { message: "Error", e: e.message };
    }
};

export { externalRequest };
