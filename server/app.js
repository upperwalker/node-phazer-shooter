const express = require("express")
const http = require('http')
const path = require('path')
const app = express()
const jwt = require('jwt-simple')
var cookieParser = require('cookie-parser')

require('dotenv').config()

app.use('/',express.static(path.join(__dirname , '../dist')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())
app.get('/auth', (req, res) => {
    const token = req.cookies['endlessWarJs']
    if (!token) return res.send({
        _authentificated: false,
        _username: ''
    })
    const decoded = jwt.decode(token, process.env.JWT_SECRET);
    return res.send({
        _authentificated: true,
        _username: decoded.username
    })
})
app.post('/login', (req, res) => {
    const {username} = req.body
    if (!username) return res.status(401).send('Empty username')
    const token = jwt.encode({username}, process.env.JWT_SECRET);
    res.cookie('endlessWarJs', token, {
        maxAge: 86_400_000,
        httpOnly: true
    });
    return res.send()
})
const PORT = process.env.PORT || 80;
const server = app.listen(PORT, function() {
    let port = server.address().port;
    console.log(`Server is listening at port ${port}`);
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


    let headers = socket.handshake.headers

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
