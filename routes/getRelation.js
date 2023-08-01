import dotenv from "dotenv";

dotenv.config();

// Get relation from SurrealDB

const getRelation = async (body, headers, db) => {
    try {
        const realtion = headers["x-rciad-requested-relation"];
        const id = headers["x-rciad-requested-id"];

        await db.signin({ user: "root", pass: process.env.SURREAL_PASS });
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
