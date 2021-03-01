const PORT = 9000
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
const io = require('socket.io')(server);

const getAllEnemies = (soldierKey) => {
    var soldiers = [];
    for (let socketID of io.sockets.adapter.rooms.keys()) {
        for (const clientId of io.sockets.adapter.rooms.get(socketID) ) {
            const clientSocket = io.sockets.sockets.get(clientId);
            if (clientSocket && clientSocket.soldier && clientSocket.soldier.name !== soldierKey) soldiers.push(clientSocket.soldier)
       }
    };
    return soldiers;
}

io.on('connection',function(socket){

    socket.on('addSoldier', function(soldier){
        console.log(`addSoldier ${soldier.name}`)
        socket.soldier = soldier
        const soldierKey = soldier.name

        const enemies = getAllEnemies(soldierKey)
        socket.emit('getEnemies', enemies);
        socket.broadcast.emit('getSoldierLocation', socket.id);
        socket.broadcast.emit('addEnemy', soldierKey);
        socket.on('sendSoldierLocation', function(socketID, soldierKey, x, y, rotation) {
            socket.broadcast.to(socketID).emit('setEnemyLocation', soldierKey, x, y, rotation);
        });

        socket.on('disconnect',function(){
            console.log('disconnect')
            socket.broadcast.emit('removeEnemy', soldierKey);
        });
        socket.on('sendPosition', function(x, y) {
            //console.log(x, y)
            socket.broadcast.emit('setPosition', soldierKey, x, y);
        });

        socket.on('sendRotation', function(rotation) {
            //console.log(rotation)
            socket.broadcast.emit('setRotation', soldierKey, rotation);
        });

        socket.on('startFire', function(rotation) {
            socket.broadcast.emit('startFire', soldierKey);
        });
        socket.on('bullet', function(velocity) {
            socket.broadcast.emit('bullet', soldierKey, velocity);
        });
        socket.on('stopFire', function(rotation) {
            socket.broadcast.emit('stopFire', soldierKey);
        });
        socket.on('reload', function(rotation) {
            socket.broadcast.emit('reload', soldierKey);
        });

        socket.on('selectWeapon', function(weaponIndex) {
            socket.broadcast.emit('selectWeapon', soldierKey, weaponIndex);
        });

    });
});
