type JWT = {
    typ: string;
    alg: string;
    iat: number;
    exp: number;
    iss: string;
    NS: string;
    DB: string;
    SC: string;
    ID: string;
};

function parseJwt(token: string): JWT {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
}

export { parseJwt };
