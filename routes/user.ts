import dotenv from "dotenv";
import crypto from "crypto";
import { createHash } from "crypto";
import { parseJwt } from "../methods/parseJwt";
import { Surreal, headers } from "./routes";

dotenv.config();

const dbPass = process.env.SURREAL_PASS || "root";

type request = {
    username: string;
    password: string;
    email?: string;
    settings?: any;
    subscriptions?: Array<string>;
};

type user = {
    user: string;
    email: string;
    settings: {
        marketing: boolean;
    };
    id: string;
    subscriptions?: Array<string>;
    created: string;
    pass: string;
    salt: string;
};

function hmacSHA256(password: crypto.BinaryLike, salt: string) {
    const passhash = createHash("sha256")
        .update(password)
        .update(createHash("sha256").update(salt, "utf8").digest("hex"))
        .digest("hex");

    return passhash;
}

async function login(req: request, headers: headers, db: Surreal) {
    const { username, password } = req;
    try {
        if (username && password) {
            const data = `user: ${username}, password: ${password}`;
            await db.signin({ user: "root", pass: dbPass });
            await db.use({ ns: "test", db: "test" });
            type user = {
                salt: string;
            };

            const userDataQuery = await db.query<[user[]]>(
                `SELECT * FROM user WHERE user = "${username}"`
            );
            const userData = userDataQuery[0].result;
            if (!userData || !userData[0]) {
                throw new Error("User not found");
            }
            const { salt } = userData[0];

            const hash = hmacSHA256(data, salt).toString();

            await db.invalidate();

            const token = await db.signin({
                NS: "test",
                DB: "test",
                SC: "allusers",
                user: username,
                pass: hash,
            });
            return { status: "OK", token, message: "Signed in" };
        } else {
            return {
                status: "Error",
                token: null,
                message: "Please provide an email and password",
            };
        }
    } catch (e: any) {
        return { status: "Error", token: null, message: e.message };
    }
}

async function signup(req: request, headers: headers, db: Surreal) {
    const { username, password, email, settings } = req;
    try {
        if (!username) throw new Error("Please provide a username");
        if (!password) throw new Error("Please provide a password");
        if (!email) throw new Error("Please provide an email");

        await db.signin({ user: "root", pass: dbPass });
        await db.use({ ns: "test", db: "test" });

        type count = {
            count: number;
        };

        const emailCheckResult = await db.query<[count]>(
            `SELECT count() FROM user WHERE email = "${email}"`
        );
        const emailCheck = emailCheckResult?.[0]?.result?.count || 0;
        if (emailCheck)
            throw new Error(
                "There's already an account with this email <a href='/forgot'>click here to reset your password</a>"
            );

        const usernameCheckResult = await db.query<[count]>(
            `SELECT count() FROM user WHERE user = "${username}"`
        );
        const usernameCheck = usernameCheckResult?.[0]?.result?.count || 0;
        if (usernameCheck)
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
    } catch (e: any) {
        return { status: "Error", token: null, message: e.message };
    }
}

async function getMe(req: request, headers: headers, db: Surreal) {
    const { authentication } = headers;
    try {
        if (!authentication) throw new Error("No authentication provided");
        await db.authenticate(authentication);
        await db.use({ ns: "test", db: "test" });

        let id = parseJwt(authentication).ID;

        let query = await db.query<[user[]]>(
            `SELECT *, "" as pass, "" as salt FROM ${id}`
        );

        let details = query?.[0]?.result?.[0] || null;

        if (!details) throw new Error("User not found");
        Object.keys(details).forEach((key) => {
            if (details?.[key as keyof typeof details] === "") {
                delete details[key as keyof typeof details];
            }
        });

        return {
            status: "OK",
            details: details,
            message: "Success",
        };
    } catch (e: any) {
        return { status: "Error", details: null, message: e.message };
    }
}

async function getUser(req: request, headers: headers, db: Surreal) {
    const user = headers["x-rciad-requested-user"];
    const id = headers["x-rciad-requested-id"];
    try {
        if (!user && !id) throw new Error("No user or ID provided");
        if (user && id)
            throw new Error("Please provide either a user or ID not both");
        await db.signin({ user: "root", pass: dbPass });
        await db.use({ ns: "test", db: "test" });

        let query = user
            ? await db.query<[user[]]>(
                  `SELECT *, "" as pass, "" as salt, "" as email, "" as settings FROM user WHERE user = '${user}'`
              )
            : await db.query<[user[]]>(
                  `SELECT *, "" as pass, "" as salt, "" as email, "" as settings FROM ${id}`
              );

        let details = query?.[0]?.result?.[0] || null;

        if (!details) throw new Error("User not found");
        Object.keys(details).forEach((key) => {
            if (details?.[key as keyof typeof details] === "") {
                delete details[key as keyof typeof details];
            }
        });

        return {
            status: "OK",
            details: details,
            message: "Success",
        };
    } catch (e: any) {
        return { status: "Error", details: null, message: e.message };
    }
}

async function updateUser(req: request, headers: headers, db: Surreal) {
    const { authentication } = headers;
    let { email, settings, subscriptions, username } = req;
    try {
        if (!authentication) throw new Error("No authentication provided");
        await db.authenticate(authentication);
        await db.use({ ns: "test", db: "test" });

        let id = parseJwt(authentication).ID;

        let userDetailsResult = await db.query<[user[]]>(`SELECT * FROM ${id}`);
        let userDetails = userDetailsResult?.[0]?.result?.[0] || null;
        if (!userDetails) throw new Error("User not found");

        let oldEmail = userDetails.email;
        let oldSettings = userDetails.settings;
        let oldSubscriptions = userDetails.subscriptions;
        let oldUser = userDetails.user;

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

        let query = await db.query<[user[]]>(
            `UPDATE ${id} MERGE ${JSON.stringify(
                content
            )} RETURN email, settings, subscriptions, user`
        );

        let details = query?.[0]?.result?.[0] || null;

        if (!details) throw new Error("No details returned");

        return {
            status: "OK",
            details: details,
            message: "Success",
        };
    } catch (e: any) {
        return { status: "Error", details: null, message: e.message };
    }
}

async function deleteUser(req: request, headers: headers, db: Surreal) {
    const { authentication } = headers;
    try {
        if (!authentication) throw new Error("No authentication provided");
        await db.authenticate(authentication);
        await db.use({ ns: "test", db: "test" });

        let id = parseJwt(authentication).ID;

        await db.query(`DELETE made_of WHERE in=${id}`);
        await db.delete(id);

        return {
            status: "OK",
            message: "Success",
        };
    } catch (e: any) {
        return { status: "Error", message: e.message };
    }
}

export { login, signup, getMe, getUser, updateUser, deleteUser };
