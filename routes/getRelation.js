import Surreal from "surrealdb.js";

const db = new Surreal(process.env.SURREAL_DB || "http://localhost:8000/rpc");

// Get relation from SurrealDB

const getRelation = async (body, headers) => {
    try {
        const realtion = headers["x-rciad-requested-relation"];
        const id = headers["x-rciad-requested-id"];

        await db.signin({ user: "root", pass: "root" });
        await db.use({ ns: "test", db: "test" });

        const data = await db.query(
            `SELECT in FROM ${realtion} WHERE out = ${id}`
        );

        let result = [];
        for (let i = 0; i < data[0].result.length; i++) {
            const element = data[0].result[i];
            console.log(element.in);
            const sib = await db.query(`SELECT * FROM ${element.in}`);
            result.push(sib[0].result[0]);
        }

        return result;
    } catch (e) {
        console.log(e);
    }
};

export { getRelation };
