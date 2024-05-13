import dotenv from "dotenv";
import { Surreal, headers } from "./routes";

dotenv.config();

// Get relation from SurrealDB
const dbPass = process.env.SURREAL_PASS || "root";
const db_url = process.env.SURREAL_DB || "http://localhost:8000/rpc";

const getRelation = async (body: any, headers: headers, db: Surreal) => {
    try {
        const realtion = headers["x-rciad-requested-relation"];
        const id = headers["x-rciad-requested-id"];

        type relation = {
            in: string;
        };

        const dataResult = await db.query<[relation[]]>(
            `SELECT in FROM ${realtion} WHERE out = ${id}`
        );

        let result = [];
        let data = dataResult[0] || null;

        if (!data) throw new Error("No results found");

        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            const sibResult = await db.query<[any[]]>(
                `SELECT * FROM ${element.in}`
            );
            let sib = sibResult[0][0] || null;
            if (!sib) continue;
            result.push(sib);
        }

        return result;
    } catch (e: any) {
        return new Error(e.message);
    }
};

export { getRelation };
