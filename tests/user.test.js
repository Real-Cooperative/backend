import {
    deleteUser,
    getMe,
    getUser,
    login,
    signup,
    updateUser,
} from "../routes/user.js";

//Jest Testing for User
describe("User Suite", () => {
    let token;
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
