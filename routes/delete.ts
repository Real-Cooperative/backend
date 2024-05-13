import dotenv from "dotenv";
import { parseJwt } from "../methods/parseJwt";
import { Surreal, headers } from "./routes";
import { RecordId } from "surrealdb.js";

dotenv.config();

type request = {
    id: string;
    [key: string]: any;
};

const delRecord = async (body: request, headers: headers, db: Surreal) => {
    try {
        const { id } = body;
        if (!id) throw new Error("No ID provided");
        const { authentication } = headers;
        if (!authentication) throw new Error("No authentication provided");
        const { ID } = parseJwt(authentication);
        if (!ID) throw new Error("No ID provided in authentication");

        const [type, name] = id.split(":");

        let record = await db.select(new RecordId(type, name));

        if (!record) throw new Error(`${id} does not exist`);
        if (record.created_by !== ID)
            throw new Error("You do not have permission to delete this record");

        await db.delete(new RecordId(type, name));
        await db.query(`DELETE made_of WHERE in=${id}`);
        return { status: "OK", message: `${id} was deleted` };
    } catch (e: any) {
        return new Error(e.message);
    }
};

export { delRecord };
