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
    const { email, password } = req;

    if (email && password) {
        const data = `email: ${email}, password: ${password}`;
        await db.signin({ user: "root", pass: "root" });
        await db.use({ ns: "test", db: "test" });
        const userData = await db.query(`SELECT * FROM user:⟨${email}⟩`);
        if (userData) {
            const { salt } = userData[0].result[0];

            const hash = hmacSHA256(data, salt).toString();

            await db.invalidate();
            try {
                const token = await db.signin({
                    NS: "test",
                    DB: "test",
                    SC: "allusers",
                    id: email,
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
    const { username, password, email, marketing } = req;

    if (email && password) {
        const data = `email: ${email}, password: ${password}`;
        const salt = crypto.randomBytes(128).toString("base64");
        const hash = hmacSHA256(data, salt).toString();

        const token = await db.signup({
            NS: "test",
            DB: "test",
            SC: "allusers",
            id: email,
            pass: hash,
        });

        await db.signin({ user: "root", pass: "root" });
        await db.use({ ns: "test", db: "test" });

        await db.merge(`user:⟨${email}⟩`, {
            user: username,
            salt: salt,
            marketing: marketing,
        });

        return token;
    } else {
        return "Please provide a valid username and password";
    }
}

export { login, signup };
