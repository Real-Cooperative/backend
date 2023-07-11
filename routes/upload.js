import formidable from "formidable";
import fs from "fs";
import path from "path";

async function upload(req, res) {
    try {
        const form = formidable({});
        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve({ fields, files });
            });
        });
        const oldpath = files.attachment[0].filepath;
        const folderName = "./assets/attachments/";
        let newpath =
            folderName +
            encodeURIComponent(files.attachment[0].originalFilename);
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
        }

        if (fs.existsSync(newpath)) {
            const ext = path.parse(newpath).ext;
            const name = path.parse(newpath).name;
            const now = Date.now();
            newpath = `${folderName}${name}_${now}${ext}`;
        }

        fs.rename(oldpath, newpath, function (err) {
            if (err) res.end(err);
            res.end(
                `${
                    process.env.SERVER_URL || "http://localhost:4000"
                }${newpath.slice(1)}`
            );
        });
    } catch (e) {
        res.end(`Error: ${e.message}`);
    }
}

export { upload };
