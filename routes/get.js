import Surreal from 'surrealdb.js';


const db = new Surreal('http://127.0.0.1:8000/rpc');


//Get request to SurrealDB
const externalRequest = async (body) => {

    try {
        let id = body.id;
        let limit = body.limit || 10;
        let page = body.page || 1;
        let data = {};
        await db.signin({user: 'root', pass: 'root',});
		await db.use('test', 'test');
        let pageQuery = await db.query(`SELECT * FROM ${id} LIMIT ${limit} START ${(page-1) * limit}`);
        data.page = pageQuery[0].result;
        let countQuery = await db.query(`SELECT count() FROM ${id} GROUP ALL`);
        data.count = countQuery[0].result[0].count;
        return data;


    } catch (e) {

        console.error('ERROR', e);

    }
}

export {externalRequest};