import dotenv from "dotenv";
import crypto from "crypto";
import { createHash } from "crypto";
import { parseJwt } from "../methods/parseJwt.js";

dotenv.config();

function hmacSHA256(password, salt) {
    const passhash = createHash("sha256")
        .update(password)
        .update(createHash("sha256").update(salt, "utf8").digest("hex"))
        .digest("hex");

    return passhash;
}

async function login(req, headers, db) {
    const { username, password } = req;

    if (username && password) {
        const data = `user: ${username}, password: ${password}`;
        await db.signin({ user: "root", pass: process.env.SURREAL_PASS });
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

async function signup(req, headers, db) {
    const { username, password, email, settings } = req;
    try {
        if (!username) throw new Error("Please provide a username");
        if (!password) throw new Error("Please provide a password");
        if (!email) throw new Error("Please provide an email");

        await db.signin({ user: "root", pass: process.env.SURREAL_PASS });
        await db.use({ ns: "test", db: "test" });

        const emailCheck = await db.query(
            `SELECT * FROM user WHERE email = "${email}"`
        );
        if (emailCheck[0].result.length > 0)
            throw new Error(
                "There's already an account with this email <a href='/forgot'>click here to reset your password</a>"
            );

        const usernameCheck = await db.query(
            `SELECT * FROM user WHERE user = "${username}"`
        );
        if (usernameCheck[0].result.length > 0)
            throw new Error("Sorry, please choose another username");

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
}

async function getMe(req, headers, db) {
    const { authentication } = headers;
    try {
        await db.authenticate(authentication);
        await db.use({ ns: "test", db: "test" });

        let id = parseJwt(authentication).ID;

        let query = await db.query(
            `SELECT *, "" as pass, "" as salt FROM ${id}`
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

async function getUser(req, headers, db) {
    const user = headers["x-rciad-requested-user"];
    const id = headers["x-rciad-requested-id"];
    try {
        if (!user && !id) throw new Error("No user or ID provided");
        if (user && id)
            throw new Error("Please provide either a user or ID not both");
        await db.signin({ user: "root", pass: process.env.SURREAL_PASS });
        await db.use({ ns: "test", db: "test" });

        let query = user
            ? await db.query(
                  `SELECT *, "" as pass, "" as salt, "" as email, "" as settings FROM user WHERE user = '${user}'`
              )
            : await db.query(
                  `SELECT *, "" as pass, "" as salt, "" as email, "" as settings FROM ${id}`
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

async function updateUser(req, headers, db) {
    const { authentication } = headers;
    let { email, settings, subscriptions, username } = req;
    try {
        await db.authenticate(authentication);
        await db.use({ ns: "test", db: "test" });

        let id = parseJwt(authentication).ID;

        let userDetails = await db.query(`SELECT * FROM ${id}`);

        let oldEmail = userDetails[0].result[0].email;
        let oldSettings = userDetails[0].result[0].settings;
        let oldSubscriptions = userDetails[0].result[0].subscriptions;
        let oldUser = userDetails[0].result[0].user;

        email = email ? email : oldEmail;
        settings = settings ? settings : oldSettings;
        subscriptions = subscriptions
            ? subscriptions
            : oldSubscriptions
            ? oldSubscriptions
            : [];
        username = username ? username : oldUser;

        let content = {
            email,
            settings,
            subscriptions,
            user: username,
        };

        let query = await db.query(
            `UPDATE ${id} MERGE ${JSON.stringify(
                content
            )} RETURN email, settings, subscriptions, user`
        );

        return {
            status: "OK",
            details: query[0].result[0],
            message: "Success",
        };
    } catch (e) {
        return { status: "Error", message: e.message };
    }
}

async function deleteUser(req, headers, db) {
    const { authentication } = headers;
    try {
        await db.authenticate(authentication);
        await db.use({ ns: "test", db: "test" });

        let id = parseJwt(authentication).ID;

        await db.query(`DELETE made_of WHERE in=${id}`);
        await db.delete(id);

        return {
            status: "OK",
            message: "Success",
        };
    } catch (e) {
        return { status: "Error", message: e.message };
    }
}

export { login, signup, getMe, getUser, updateUser, deleteUser };
