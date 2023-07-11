import Surreal from "surrealdb.js";
import dotenv from "dotenv";

dotenv.config();

const db = new Surreal(process.env.SURREAL_DB || "http://localhost:8000/rpc");

//Get request to SurrealDB
const externalRequest = async (body) => {
    try {
        let id = body.id;
        let limit = body.limit || 10;
        let page = body.page || 1;
        let data = {};
        await db.signin({ user: "root", pass: "root" });
        await db.use({ ns: "test", db: "test" });
        let pageQuery = await db.query(
            `SELECT * FROM ${id} LIMIT ${limit} START ${(page - 1) * limit}`
        );
        data.page = pageQuery[0].result;
        let countQuery = await db.query(`SELECT count() FROM ${id} GROUP ALL`);
        data.count = countQuery[0].result[0]
            ? countQuery[0].result[0].count
            : 0;
        return data;
    } catch (e) {
        console.error("ERROR", e);
    }
};

export { externalRequest };
