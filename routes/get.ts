import dotenv from "dotenv";
import { parseJwt } from "../methods/parseJwt";
import { Surreal, headers } from "./routes";
dotenv.config();

const dbPass = process.env.SURREAL_PASS || "root";

type request = {
    [key: string]: any;
};

//Get request to SurrealDB
const externalRequest = async (
    body: request,
    headers: headers,
    db: Surreal
) => {
    try {
        const subscribed =
            (headers["x-rciad-subscribed"] &&
                headers["x-rciad-subscribed"].replaceAll(",", " OR ")) ||
            undefined;
        const id = headers["x-rciad-requested-id"];
        let user = headers.authentication
            ? parseJwt(headers.authentication).ID
            : undefined;
        const limitHeader = parseInt(headers["x-rciad-limit"] || "10");
        const pageHeader = parseInt(headers["x-rciad-page"] || "1");

        let data = {
            page: {},
            count: 0,
        };

        await db.signin({ user: "root", pass: dbPass });
        await db.use({ ns: "test", db: "test" });

        type page = {
            [key: string]: any;
        };

        let pageQuery = await db.query<[page[]]>(
            `SELECT * FROM ${id} WHERE ${
                user
                    ? "created_by = " + user
                    : subscribed
                    ? "created_by = " + subscribed
                    : "true"
            } ORDER created_at DESC LIMIT ${limitHeader} START ${
                (pageHeader - 1) * limitHeader
            }`
        );
        let pageResult = pageQuery[0].result ? pageQuery[0].result : undefined;
        if (!pageResult) throw new Error("No results found");
        type user = {
            user: string;
        };
        await Promise.all(
            pageResult.map(async (item) => {
                let authorQuery = await db.query<[user[]]>(
                    `SELECT user FROM ${item.created_by}`
                );
                item.author = authorQuery[0].result
                    ? authorQuery[0].result[0].user
                    : "Anonymous";
            })
        );

        data.page = pageResult;

        type count = {
            count: number;
        };
        let countQuery = await db.query<[count[]]>(
            `SELECT count() FROM ${id} WHERE ${
                user
                    ? "created_by = " + user
                    : subscribed
                    ? "created_by = " + subscribed
                    : "true"
            } GROUP ALL`
        );
        data.count = countQuery?.[0]?.result?.[0]
            ? countQuery[0].result[0].count
            : 0;
        return data;
    } catch (e: any) {
        return { status: "Error", message: e.message };
    }
};

export { externalRequest };
