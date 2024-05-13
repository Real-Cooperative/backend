import dotenv from "dotenv";
import { parseJwt } from "../methods/parseJwt";
import { Surreal, headers } from "./routes";
dotenv.config();

const dbPass = process.env.SURREAL_PASS || "root";
const db_url = process.env.SURREAL_DB || "http://localhost:8000/rpc";

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

        type page = {
            [key: string]: any;
        };

        let pageQuery = await db.query<[page[]]>(
            `SELECT * FROM ${id} WHERE ${
                user
                    ? "created_by = s'" + user + "'"
                    : subscribed
                    ? "created_by = s'" + subscribed + "'"
                    : "true"
            } ORDER created_at DESC LIMIT ${limitHeader} START ${
                (pageHeader - 1) * limitHeader
            }`
        );

        let pageResult = pageQuery ? pageQuery[0] : undefined;
        if (!pageResult) throw new Error("No results found");
        type user = {
            username: string;
        };
        await Promise.all(
            pageResult.map(async (item) => {
                let authorQuery = await db.query<[user[]]>(
                    `SELECT username FROM ${item.created_by}`
                );
                item.author =
                    authorQuery[0] && authorQuery[0][0]
                        ? authorQuery[0][0].username
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
                    ? "created_by = s'" + user + "'"
                    : subscribed
                    ? "created_by = s'" + subscribed + "'"
                    : "true"
            } GROUP ALL`
        );
        data.count =
            countQuery[0] && countQuery[0][0] ? countQuery[0][0].count : 0;
        return data;
    } catch (e: any) {
        return new Error(e.message);
    }
};

export { externalRequest };
