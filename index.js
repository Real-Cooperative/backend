const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const post = require('./routes/post');


const PORT = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
    if (req.url === '/post' && req.method === 'POST'){
        req.on('data', async (data) => {
            const body = JSON.parse(data);
            post.externalRequest(body);
        });
        res.end();
    } else {
        const parsedUrl = url.parse(req.url);
        // extract URL path
        let pathname = `.${parsedUrl.pathname}`;
        // based on the URL path, extract the file extension. e.g. .js, .doc, ...
        const ext = path.parse(pathname).ext;
        // maps file extension to MIME typere
        const map = {
            '.ico': 'image/x-icon',
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword'
        };

        fs.stat(pathname, function (err, exist) {
            if(err) {
                // if the file is not found, return 404
                res.statusCode = 404;
                res.end(`File ${pathname} not found!`);
                return;
            }

            // if is a directory search for index file matching the extension
            if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

            // read file from file system
            fs.readFile(pathname, function(err, data){
                if(err){
                    res.statusCode = 500;
                    res.end(`Error getting the file: ${err}.`);
                } else {
                    // if the file is found, set Content-type and send data
                    res.setHeader('Content-type', map[ext] || 'text/plain' );
                    res.end(data);
                }
            });
        });
    }
});


server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});