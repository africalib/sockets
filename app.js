const express = require('express');
const socket = require('socket.io');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socket(server);
const fs = require('fs');

global.rooms = [];

app.use('/css', express.static('./wwwroot/css'));
app.use('/js', express.static('./wwwroot/js'));
app.get('/', (req, res) => {
    fs.readFile('./wwwroot/index.html', (err, data) => {
        if (err) {
            res.send('error');
        }
        else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            res.end()
        }
    });
});

app.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.get('/rooms', (req, res) => {
    var rooms = [];

    for (var i in global.rooms) {
        if (!global.rooms[i].playing)
            rooms.push(global.rooms[i]);
    }

    res.write(JSON.stringify(rooms));
    res.end()
});

io.sockets.on('connection', (socket) => {
    console.log('connected');

    socket.on('enter', (name) => {
        var connect = function (name) {
            socket.room = name;
            socket.join(socket.room);

            io.sockets.to(socket.room).emit('update', {
                name: 'connect',
                room: socket.room,
                player: socket.player,
                turn: 'black'
            });
        }

        if (name) {
            for (let i in global.rooms) {
                if (global.rooms[i].name === name) {
                    if (global.rooms[i].count < 2) {
                        global.rooms[i].count += 1;
                        global.rooms[i].playing = true;

                        socket.player = 'white';
                        connect(name);

                        io.sockets.to(socket.room).emit('update', {
                            name: 'start',
                            room: socket.room
                        });
                    }
                    else {
                        console.log('the room is full.');
                        return;
                    }
                    break;
                }
            }
        }
        else {
            let alphabets = 'abcdefghijklmnopqrstuvwxyz'
            let name = '';

            for (let i = 0; i < 7; i += 1) {
                let ranNum = Math.floor(Math.random() * alphabets.length);
                name += (Math.random() >= 0.5 ? alphabets[ranNum].toUpperCase() : alphabets[ranNum]) + (Math.random() >= 0.5 ? ranNum : i);
            }

            name = name + (global.rooms.length + 1);

            global.rooms.push({
                name: name,
                count: 1,
                playing: false
            });

            socket.player = 'black';
            connect(name);
        }
    });

    socket.on('request', (value) => {
        //console.log(value);

        io.sockets.to(socket.room).emit('update', {
            name: 'response',
            room: socket.room,
            value: value
        });
    });

    socket.on('disconnect', () => {
        console.log('disconnect');

        for (let i in global.rooms) {
            if (global.rooms[i].name === socket.room) {
                global.rooms[i].count -= 1;

                if (!global.rooms[i].count)
                    global.rooms.splice(i, 1);

                //console.log(global.rooms);
                break;
            }
        }

        io.sockets.to(socket.room).emit('update', {
            name: 'disconnect',
            room: socket.room,
            val1: 'closed: ' + socket.player
        });
    });
});

server.listen(8080, () => {
    console.log('server is running');
});