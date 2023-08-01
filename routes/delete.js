import dotenv from "dotenv";
import { parseJwt } from "../methods/parseJwt.js";

dotenv.config();

const delRecord = async (body, headers, db) => {
    try {
        const { id } = body;
        if (!id) throw new Error("No ID provided");
        const { authentication } = headers;
        if (!authentication) throw new Error("No authentication provided");
        const { ID } = parseJwt(authentication);
        if (!ID) throw new Error("No ID provided in authentication");
        await db.authenticate(authentication);

        let [record] = await db.select(id);

        if (!record) throw new Error(`${id} does not exist`);
        if (record.created_by !== ID)
            throw new Error("You do not have permission to delete this record");

        await db.delete(id);
        await db.query(`DELETE made_of WHERE in=${id}`);
        return { status: "OK", message: `${id} was deleted` };
    } catch (e) {
        return { status: "Error", message: e.message };
    }
};

export { delRecord };
