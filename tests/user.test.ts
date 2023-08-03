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
import { Surreal } from "surrealdb.js";
const db = new Surreal(process.env.SURREAL_DB || "http://localhost:8000/rpc");
//Jest Testing for User
describe("User Suite", () => {
    let token: string | null;
    const name = Math.random().toString(36).substring(7);

    test("Signup", async () => {
        const req = {
            username: "test",
            password: "test",
            email: "test@test.com",
            settings: {
                marketing: true,
            },
        };

        const headers = {};
        let res = await signup(req, headers, db);
        token = res.token;
        expect(res).toHaveProperty("token");
        expect(res).toHaveProperty("status", "OK");
        expect(res).toHaveProperty("message", "Registered");
    });

    test("Login", async () => {
        let req = {
            username: "test",
            password: "test",
        };
        const headers = {};
        let res = await login(req, headers, db);
        expect(res).toHaveProperty("token");
        expect(res).toHaveProperty("status", "OK");
        expect(res).toHaveProperty("message", "Signed in");
    });

    test("Get Me", async () => {
        try {
            const req = {
                username: "test",
                password: "test",
            };
            if (!token) throw new Error("No token");

            const headers = {
                authentication: token,
            };

            let res = await getMe(req, headers, db);
            expect(res.details).toHaveProperty("user", "test");
            expect(res).toHaveProperty("status", "OK");
            expect(res).toHaveProperty("message", "Success");
        } catch (error) {
            expect(error).toHaveProperty("message", "User not found");
        }
    });

    test("Get User", async () => {
        const req = {
            username: "test",
            password: "test",
        };
        const headers = {
            "x-rciad-requested-user": "test",
        };
        const res = await getUser(req, headers, db);
        expect(res.details).toHaveProperty("user", "test");
        expect(res).toHaveProperty("status", "OK");
        expect(res).toHaveProperty("message", "Success");
    });

    test("Update User", async () => {
        try {
            const req = {
                username: "test",
                password: "test",
                settings: {
                    marketing: false,
                },
            };
            if (!token) throw new Error("No token");
            const headers = {
                authentication: token,
            };
            let res = await updateUser(req, headers, db);
            if (!res.details) throw new Error("No details");
            expect(res.details.settings.marketing).toEqual(false);
            expect(res).toHaveProperty("status", "OK");
            expect(res).toHaveProperty("message", "Success");
        } catch (error) {
            expect(error).toHaveProperty(
                "message",
                "User not found" ||
                    "No authentication provided" ||
                    "No details returned"
            );
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
            expect(res).toHaveProperty("message", "Success");
            expect(res).toHaveProperty("id", `recipe:${name}`);
        } catch (error) {
            expect(error).toHaveProperty(
                "message",
                "authentication is required" ||
                    "type is required" ||
                    "name is required"
            );
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
            expect(res).toHaveProperty("status", "OK");
            expect(res).toHaveProperty("message", `recipe:${name} was deleted`);
        } catch (error) {
            expect(error).toHaveProperty(
                "message",
                "You do not have permission to delete this record"
            );
        }
    });

    test("Delete User", async () => {
        try {
            if (!token) throw new Error("No token");
            let req = {
                username: "test",
                password: "test",
            };
            let headers = {
                authentication: token,
            };
            let res = await deleteUser(req, headers, db);
            expect(res).toEqual({
                status: "OK",
                message: "Success",
            });
        } catch (error) {
            expect(error).toHaveProperty(
                "message",
                "No authentication provided"
            );
        }
    });
});
