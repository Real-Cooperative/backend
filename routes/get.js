import Surreal from 'surrealdb.js';


const db = new Surreal('http://127.0.0.1:8000/rpc');


//Get request to SurrealDB
const externalRequest = async (body) => {

    try {

        await db.signin({user: 'root', pass: 'root',});
		await db.use('test', 'test');
        const data = await db.select(body.id);
        return data;


    } catch (e) {

        console.error('ERROR', e);

    }
}

export {externalRequest};