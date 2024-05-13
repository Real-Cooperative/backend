import dotenv from "dotenv";
import { parseJwt } from "../methods/parseJwt";
import { Surreal, headers } from "./routes";
import { RecordId } from "surrealdb.js";

dotenv.config();

type request = {
    type: string;
    name: string;
    [key: string]: any;
};

const dbPass = process.env.SURREAL_PASS || "root";
const db_url = process.env.SURREAL_DB || "http://localhost:8000/rpc";

const externalRequest = async (
    body: request,
    headers: headers,
    db: Surreal
) => {
    try {
        const { type, name } = body;
        const { authentication } = headers;

        if (!authentication) throw new Error("authentication is required");

        const { ID } = parseJwt(authentication);

        if (!type) throw new Error("type is required");
        if (!name) throw new Error("name is required");

        let id = new RecordId(
            type.replaceAll(" ", "_"),
            name.replaceAll(" ", "_")
        );
        let idQuery = await db.select(id);

        body.created_by = ID;
        body.created_at = Date.now();

        if (idQuery) {
            id = new RecordId(
                type.replaceAll(" ", "_"),
                `${name.replaceAll(" ", "_")}_${Date.now()}`
            );
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
        console.log(body);
        await db.create(id, body);

        return { message: "Success", id };

        async function arrayLoop(property: string) {
            for (let obj of body[property]) {
                await relateObj(obj);
            }
        }

        async function relateObj(obj: request) {
            if (!obj.type || !obj.name) return;
            let objID = new RecordId(
                obj.type.replaceAll(" ", "_"),
                obj.name.replaceAll(" ", "_")
            );
            obj.id = objID;

            const result = await db.select(objID);

            if (!result) {
                let [tableQuery] = await db.select(objID.tb);
                await db.create(objID, { name: obj.name, created_by: ID });
                if (!tableQuery) {
                    await db.query(`
                    DEFINE TABLE ${objID.tb} SCHEMALESS
                        PERMISSIONS
                        FOR select WHERE true
                        FOR create, update, delete WHERE created_by = $auth.id OR $auth.admin = true;
                    `);
                }
            }
            await db.query(
                `RELATE ${id.tb}:${id.id}->made_of->${objID.tb}:${objID.id}`
            );
        }
    } catch (e: any) {
        return new Error(e.message);
    }
};

export { externalRequest };
