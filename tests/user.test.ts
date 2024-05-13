import {
    deleteUser,
    getMe,
    getUser,
    login,
    signup,
    updateUser,
} from "../routes/user";

import { externalRequest as post } from "../routes/post";
import { delRecord } from "../routes/delete";
import { RecordId, Surreal } from "surrealdb.js";
const db = new Surreal();
const db_url = process.env.SURREAL_DB || "http://localhost:8000/rpc";
const dbPass = process.env.SURREAL_PASS || "root";
async function dbConnect(db: Surreal) {
    console.log("Connecting to Surreal...");
    await db.connect(db_url, {
        auth: {
            username: "root",
            password: dbPass,
        },
        namespace: "test",
        database: "test",
    });
    console.log("Connected to Surreal");
}
dbConnect(db);
//Jest Testing for User
function errorCheck(message: string, expected: string[]) {
    let found = false;
    expected.forEach((e) => {
        if (message.includes(e)) {
            found = true;
        }
    });
    return found;
}

const username = "test";
const password = "test";

describe("User Suite", () => {
    let token: string | null;
    const name = Math.random().toString(36).substring(7);

    test("Signup", async () => {
        try {
            const req = {
                username,
                password,
                email: "test@test.com",
                settings: {
                    marketing: true,
                },
            };

            const headers = {};
            let res = await signup(req, headers, db);
            if (res instanceof Error) throw res;
            token = res.token;
            expect(res).toHaveProperty("token");
            expect(res).toHaveProperty("status", "OK");
            expect(res).toHaveProperty("message", "Registered");
        } catch (error: any) {
            console.error(error);
            const expected = [
                "Please provide a username",
                "Please provide a password",
                "Please provide an email",
                "Sorry, please choose another username",
                "There's already an account with this email <a href='/forgot'>click here to reset your password</a>",
            ];
            expect(errorCheck(error.message, expected)).toBe(true);
        }
    });

    test("Login", async () => {
        try {
            let req = {
                username,
                password,
            };
            const headers = {};
            let res = await login(req, headers, db);
            if (res instanceof Error) throw res;
            token = res.token;
            expect(res).toHaveProperty("token");
            expect(res).toHaveProperty("status", "OK");
            expect(res).toHaveProperty("message", "Signed in");
        } catch (error: any) {
            console.error(error);
            const expected = [
                "Please provide an email and password",
                "User not found",
            ];
            expect(errorCheck(error.message, expected)).toBe(true);
        }
    });

    test("Get Me", async () => {
        try {
            const req = {
                username,
                password,
            };
            if (!token) throw new Error("No authentication provided");

            const headers = {
                authentication: token,
            };

            let res = await getMe(req, headers, db);
            if (res instanceof Error) throw res;
            expect(res.details).toHaveProperty("username", "test");
            expect(res).toHaveProperty("status", "OK");
            expect(res).toHaveProperty("message", "Success");
        } catch (error: any) {
            console.error(error);
            const expected = ["No authentication provided", "User not found"];
            expect(errorCheck(error.message, expected)).toBe(true);
        }
    });

    test("Get User", async () => {
        try {
            const req = {
                username: "test",
                password: "test",
            };
            const headers = {
                "x-rciad-requested-user": "test",
            };
            const res = await getUser(req, headers, db);
            if (res instanceof Error) throw res;
            expect(res.details).toHaveProperty("username", "test");
            expect(res).toHaveProperty("status", "OK");
            expect(res).toHaveProperty("message", "Success");
        } catch (error: any) {
            console.error("Get User", error);
            const expected = [
                "No user or ID provided",
                "Please provide either a user or ID not both",
                "User not found",
            ];
            expect(errorCheck(error.message, expected)).toBe(true);
        }
    });

    test("Update User", async () => {
        try {
            const req = {
                username,
                password,
                settings: {
                    marketing: false,
                },
            };
            if (!token) throw new Error("No token");
            const headers = {
                authentication: token,
            };
            let res = await updateUser(req, headers, db);
            if (res instanceof Error) throw res;
            if (!res.details) throw new Error("No details returned");
            expect(res.details.settings.marketing).toEqual(false);
            expect(res).toHaveProperty("status", "OK");
            expect(res).toHaveProperty("message", "Success");
        } catch (error: any) {
            console.error(error);
            const expected = [
                "No token",
                "No details returned",
                "No authentication provided",
            ];
            expect(errorCheck(error.message, expected)).toBe(true);
        }
    });

    test("Post", async () => {
        try {
            if (!token) throw new Error("No token");
            let req = {
                name: name,
                type: "recipe",
                ingredient: [
                    {
                        name: "Chicken Breast",
                        quantity: 2,
                        unit: "pieces",
                        type: "meat",
                    },
                    {
                        name: "Romaine Lettuce",
                        quantity: 1,
                        unit: "head",
                        type: "plant",
                    },
                ],
                steps: [
                    "Season chicken breasts with salt and black pepper.",
                    "In a hot skillet, heat olive oil and cook the chicken until golden brown and cooked through.",
                ],
            };
            let headers = {
                authentication: token,
            };
            let res = await post(req, headers, db);
            if (res instanceof Error) throw res;
            expect(res).toHaveProperty("message", "Success");
            expect(res.id).toEqual(new RecordId("recipe", name));
        } catch (error: any) {
            console.error(error);
            const expected = [
                "authentication is required",
                "type is required",
                "name is required",
                "No token",
            ];
            expect(errorCheck(error.message, expected)).toBe(true);
        }
    });

    test("Delete Post", async () => {
        try {
            if (!token) throw new Error("No token");
            let req = {
                id: `recipe:${name}`,
            };
            let headers = {
                authentication: token,
            };

            let res = await delRecord(req, headers, db);
            if (res instanceof Error) throw res;
            expect(res).toHaveProperty("status", "OK");
            expect(res).toHaveProperty("message", `recipe:${name} was deleted`);
        } catch (error: any) {
            console.error(error);
            const expected = [
                "No ID provided",
                "No authentication provided",
                `$recipe:${name} does not exist`,
                "No token",
            ];
            expect(errorCheck(error.message, expected)).toBe(true);
        }
    });

    test("Delete User", async () => {
        try {
            if (!token) throw new Error("No authentication provided");
            let req = {
                username: "test",
                password: "test",
            };
            let headers = {
                authentication: token,
            };
            let res = await deleteUser(req, headers, db);
            if (res instanceof Error) throw res;
            expect(res).toEqual({
                status: "OK",
                message: "Success",
            });
        } catch (error: any) {
            console.error(error);
            const expected = ["No authentication provided", "User not found"];
            expect(errorCheck(error.message, expected)).toBe(true);
        }
    });
});
