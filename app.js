const express = require('express');
const socket = require('socket.io');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socket(server);
const fs = require('fs');

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

global.rooms = [];

io.sockets.on('connection', (socket) => {
    console.log('connected');

    socket.on('enter', (room) => {
        if (room) {
            for (let i in global.rooms) {
                if (global.rooms[i].name === room) {
                    if (global.rooms[i].count < 2)
                        global.rooms[i].count += 1;
                    else
                        console.log('full');
                    break;
                }
            }
        }
        else {
            let alphabets = 'abcdefghijklmnopqrstuvwxyz'
            let name = '';

            for (let i = 0; i < 5; i += 1) {
                let ranNum = Math.floor(Math.random() * alphabets.length);
                name += alphabets[ranNum];
            }

            room = name + (global.rooms.length + 1);

            global.rooms.push({
                name: room,
                count: 1
            });
        }

        console.log('enter ' + room);
        console.log(global.rooms);

        socket.room = room;
        socket.join(socket.room);

        if (!global.number) {
            global.number = 1;
            socket.name = 'black'
        }
        else {
            global.number += 1;
            socket.name = 'white';
        }

        io.sockets.to(socket.room).emit('update', {
            name: 'connect',
            room: socket.room,
            player: socket.name,
            turn: 'black'
        });

        if (global.number > 1) {
            delete global.number;

            io.sockets.to(socket.room).emit('update', {
                name: 'start',
                room: socket.room
            });
        }
    });

    socket.on('request', (value) => {
        console.log(value);

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

                console.log(global.rooms);
                break;
            }
        }

        io.sockets.to(socket.room).emit('update', {
            name: 'disconnect',
            room: socket.room,
            val1: 'closed: ' + socket.name
        });
    });
});

server.listen(8080, () => {
    console.log('server is running');
});