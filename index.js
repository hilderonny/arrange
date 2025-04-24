const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const fileupload = require('express-fileupload');

const HTTP_PORT = 80;
const HTTPS_PORT = 443;

// Initialize application
const app = express();
app.use(fileupload()); // Enable file upload

// Expose the files folder as Server webpage root, automatically servers files/index.html als start page
app.use('/', express.static(__dirname + '/files'));

// Include APIs
app.use('/api/files', require('./api/files.js'));
app.use('/api/schema', require('./api/schema.js'));
app.use('/api/hashmap', require('./api/hashmap.js'));



// Start HTTPS and HTTP servers
var server = https.createServer({ 
    key: fs.readFileSync('./priv.key', 'utf8'), 
    cert: fs.readFileSync('./pub.cert', 'utf8')
}, app);
server.listen(HTTPS_PORT, () => {
    console.log(`HTTPS running at port ${HTTPS_PORT}.`);
});
// Redirect HTTP to HTTPS
http.createServer((req, res) => {
    if (!req || !req.headers || !req.headers.host) return; // Spamming bots will not be handled
    var indexOfColon = req.headers.host.lastIndexOf(':');
    var hostWithoutPort = indexOfColon > 0 ? req.headers.host.substring(0, indexOfColon) : req.headers.host;
    var newUrl = `https://${hostWithoutPort}:${HTTPS_PORT}${req.url}`;
    res.writeHead(302, { 'Location': newUrl });
    res.end();
}).listen(HTTP_PORT, function() {
    console.log(`HTTP running at port ${HTTP_PORT}.`);
});