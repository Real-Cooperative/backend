const { default: Surreal } = require('surrealdb.js');
const fs = require('fs');

const db = new Surreal('http://127.0.0.1:8000/rpc');

module.exports.externalRequest = async (body) => {
    let id = `${(body.type).replaceAll(' ', '_')}:${(body.name).replaceAll(' ', '_')}`;
    try {

		// Signin as a namespace, database, or root user
		await db.signin({
			user: 'root',
			pass: 'root',
		});

		// Select a specific namespace / database
		await db.use('test', 'test');
        if (await db.select(id)) {
            id = `${id}_${Date.now()}`;
        }
        console.log(id);

        for (let property in body) {
            if (Array.isArray(body[property])) {
                for (let obj of body[property]) {
                    if (obj.type && obj.name) {
                        let objID = `${(obj.type).replaceAll(' ', '_')}:${(obj.name).replaceAll(' ', '_')}`;
                        if (!await db.select(objID)) {
                            await db.create(objID, {
                                name: obj.name,
                                [body.type]: [id],
                            });
                        } else {
                            const objData = await db.select(objID);
                            objData[body.type].push(id);
                            await db.update(objID, objData);
                        }
                        obj.id = objID;
                    }
                }
            } else if (typeof body[property] === 'object') {
                if (body[property].type && body[property].name) {
                    let propertyID = `${(body[property].type).replaceAll(' ', '_')}:${(body[property].name).replaceAll(' ', '_')}`;
                    if (!await db.select(propertyID)) {
                        await db.create(propertyID, {
                            name: body[property].name,
                            [body.type]: [id],
                        });
                    } else {
                        const propertyData = await db.select(propertyID);
                        propertyData[body.type].push(id);
                        await db.update(propertyID, propertyData);
                    }
                    body[property].id = propertyID;
                }
            }
        }

        if (body.attachments) {
            for (let attachment of body.attachments) {
                let fileName = encodeURI(attachment.name);
                let fileData = attachment.data;
                if(!fs.existsSync('./assets/attachments')){
                    fs.mkdirSync('./assets/attachments');
                }
                fs.writeFile(`./assets/attachments/${fileName}`, fileData, 'base64', (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
                attachment.url = `/assets/attachments/${fileName}`;
            }
        }

        await db.create(id, body);

	} catch (e) {

		console.error('ERROR', e);

	}
}