import Surreal from "surrealdb.js";
import dotenv from "dotenv";
import { parseJwt } from "../methods/parseJwt.js";

dotenv.config();

const db = new Surreal(process.env.SURREAL_DB || "http://localhost:8000/rpc");

//Get request to SurrealDB
const externalRequest = async (body, headers) => {
    try {
        const subscribed =
            (headers["x-rciad-subscribed"] &&
                headers["x-rciad-subscribed"].replaceAll(",", " OR ")) ||
            undefined;
        const id = headers["x-rciad-requested-id"];
        let user = headers.authentication
            ? parseJwt(headers.authentication).ID
            : undefined;
        const limit = headers["x-rciad-limit"] || 10;
        const page = headers["x-rciad-page"] || 1;
        let data = {};
        await db.signin({ user: "root", pass: "root" });
        await db.use({ ns: "test", db: "test" });
        let pageQuery = await db.query(
            `SELECT * FROM ${id} WHERE ${
                user
                    ? "created_by = " + user
                    : subscribed
                    ? "created_by = " + subscribed
                    : "true"
            } ORDER created_at DESC LIMIT ${limit} START ${(page - 1) * limit}`
        );
        data.page = pageQuery[0].result;
        let countQuery = await db.query(
            `SELECT count() FROM ${id} WHERE ${
                user
                    ? "created_by = " + user
                    : subscribed
                    ? "created_by = " + subscribed
                    : "true"
            } GROUP ALL`
        );
        data.count = countQuery[0].result[0]
            ? countQuery[0].result[0].count
            : 0;
        return data;
    } catch (e) {
        console.error("ERROR", e);
    }
};

export { externalRequest };
