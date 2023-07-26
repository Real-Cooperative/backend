import {
    deleteUser,
    getMe,
    getUser,
    login,
    signup,
    updateUser,
} from "../routes/user.js";

import { externalRequest as post } from "../routes/post.js";
import { delRecord } from "../routes/delete.js";

//Jest Testing for User
describe("User Suite", () => {
    let token;
    let name = Math.random().toString(36).substring(7);

    test("Signup", async () => {
        let req = {
            username: "test",
            password: "test",
            email: "test@test.com",
            settings: {
                marketing: true,
            },
        };
        let res = await signup(req);
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
        let res = await login(req);
        expect(res).toHaveProperty("token");
        expect(res).toHaveProperty("status", "OK");
        expect(res).toHaveProperty("message", "Signed in");
    });

    test("Get Me", async () => {
        let req = {};
        let headers = {
            authentication: token,
        };
        let res = await getMe(req, headers);
        expect(res.details).toHaveProperty("user", "test");
        expect(res).toHaveProperty("status", "OK");
        expect(res).toHaveProperty("message", "Success");
    });

    test("Get User", async () => {
        let req = {};
        let headers = {
            "x-rciad-requested-user": "test",
        };
        let res = await getUser(req, headers);
        expect(res.details).toHaveProperty("user", "test");
        expect(res).toHaveProperty("status", "OK");
        expect(res).toHaveProperty("message", "Success");
    });

    test("Update User", async () => {
        let req = {
            settings: {
                marketing: false,
            },
        };
        let headers = {
            authentication: token,
        };
        let res = await updateUser(req, headers);
        expect(res.details.settings.marketing).toEqual(false);
        expect(res).toHaveProperty("status", "OK");
        expect(res).toHaveProperty("message", "Success");
    });

    test("Post", async () => {
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
        let res = await post(req, headers);
        expect(res).toHaveProperty("message", "Success");
        expect(res).toHaveProperty("id", `recipe:${name}`);
    });

    test("Delete Post", async () => {
        let req = {
            id: `recipe:${name}`,
        };
        let headers = {
            authentication: token,
        };

        let res = await delRecord(req, headers);
        expect(res).toHaveProperty("status", "OK");
        expect(res).toHaveProperty("message", `recipe:${name} was deleted`);
    });

    test("Delete User", async () => {
        let req = {};
        let headers = {
            authentication: token,
        };
        let res = await deleteUser(req, headers);
        expect(res).toEqual({
            status: "OK",
            message: "Success",
        });
    });
});
