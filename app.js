var fs = require('fs');
var privateKey  = fs.readFileSync('ssl-key', 'utf8');
var certificate = fs.readFileSync('ssl-crt', 'utf8');
var ca = fs.readFileSync('ca-bundle', 'utf8');
var credentials = {key: privateKey, cert: certificate,ca: ca};

let app = require('express')(),
    https = require('https').createServer(credentials, app),
    io = require('socket.io')(https.listen(3000)),
    bodyParser     =         require("body-parser"),
    DraftController = require("./controllers/draft.controller");
https.setMaxListeners(100000);
new DraftController(io);

module.exports = app;
