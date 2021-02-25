const PORT = 3000
const express = require("express")
const http = require('http')
const path = require('path')
const app = express()
const server = http.createServer(app);
server.listen(PORT, () => {
    console.log('Server listening on '+ server.address().port);
});
app.use('/js',express.static(path.join(__dirname , '../client/js')));
app.use('/assets',express.static(path.join(__dirname , '../client/assets')));
app.get('/', function(req,res){
    res.sendFile(path.join(__dirname , '../client/index.html'));
});
const io = require('socket.io')(server); // TODO

