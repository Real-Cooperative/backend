import Surreal from "surrealdb.js";
import dotenv from "dotenv";
import crypto from "crypto";
import { createHash } from "crypto";

dotenv.config();

const db = new Surreal("http://127.0.0.1:8000/rpc");

function hmacSHA256(password, salt) {
    const passhash = createHash("sha256")
        .update(password)
        .update(createHash("sha256").update(salt, "utf8").digest("hex"))
        .digest("hex");

    return passhash;
}

async function login(req) {
    const { username, password } = req;

    if (username && password) {
        const data = `user: ${username}, password: ${password}`;
        await db.signin({ user: "root", pass: "root" });
        await db.use({ ns: "test", db: "test" });
        const userData = await db.query(
            `SELECT * FROM user WHERE user = "${username}"`
        );
        if (userData) {
            const { salt } = userData[0].result[0];

            const hash = hmacSHA256(data, salt).toString();

            await db.invalidate();
            try {
                const token = await db.signin({
                    NS: "test",
                    DB: "test",
                    SC: "allusers",
                    user: username,
                    pass: hash,
                });
                return { status: "OK", token, message: "Signed in" };
            } catch (e) {
                return { status: "Error", token: null, message: e.message };
            }
        }
    } else {
        return {
            status: "Error",
            token: null,
            message: "Please provide an email and password",
        };
    }
}

async function signup(req) {
    const { username, password, email, settings } = req;

    if (email && password) {
        try {
            const data = `user: ${username}, password: ${password}`;
            const salt = crypto.randomBytes(64).toString("base64");
            const hash = hmacSHA256(data, salt).toString();
            const time = new Date().toISOString();

            const token = await db.signup({
                NS: "test",
                DB: "test",
                SC: "allusers",
                email: email,
                pass: hash,
                user: username,
                salt: salt,
                settings: settings,
                created: time,
            });

            return { status: "OK", token, message: "Registered" };
        } catch (e) {
            return { status: "Error", token: null, message: e.message };
        }
    } else {
        return "Please provide a valid username and password";
    }
}

async function getMe(req) {
    const { token, username } = req;
    try {
        await db.authenticate(token);

        let query = await db.query(
            `SELECT *, "" as pass, "" as salt FROM user WHERE user = "${username}"`
        );

        let details = query[0].result[0];

        Object.keys(details).forEach(
            (key) => details[key] === "" && delete details[key]
        );

        return {
            status: "OK",
            details: details,
            message: "Success",
        };
    } catch (e) {
        return { status: "Error", details: null, message: e.message };
    }
}

export { login, signup, getMe };
