const http = require('http');
const fs = require('fs');
const express = require('express');
const app = express();
const socket = require('socket.io');
const cors = require('cors');
let server, io;

global.rooms = [];

app.use(cors());
app.use(express.static(__dirname + '/wwwroot'));
app.get('/', (req, res) => {
    fs.readFile('./wwwroot/index.html', (err, data) => {
        if (err) {
            res.send(JSON.stringify(err));
        }
        else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            res.end()
        }
    });
});

app.get('/valid', (req, res) => {	
	for (let i in global.rooms) {
		var room = global.rooms[i];
		
		if (room.name === req.query.name) {
			if(room.playing)
				res.write('playing');
			else
				res.write('valid');
			
			res.end();
			return;
		}
	}
	
	res.write('empty');
	res.end();
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

server = http.createServer(app);
io = socket(server);

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
        };

        var make = function (name) {
			var maker = Math.random() >= 0.5 ? 'black' : 'white';
			
            global.rooms.push({
                name: name,
                count: 1,
                playing: false,
				maker: maker
            });

            socket.player = maker;
            connect(name);
        };

        if (name) {
            for (let i in global.rooms) {
                if (global.rooms[i].name === name) {
                    if (global.rooms[i].count < 2) {
                        global.rooms[i].count += 1;
                        global.rooms[i].playing = true;

                        socket.player = global.rooms[i].maker === 'black' ? 'white' : 'black';
                        connect(name);

                        io.sockets.to(socket.room).emit('update', {
                            name: 'start',
                            room: socket.room
                        });

                        return;
                    }
                    else {
                        console.log('the room is full.');
                        return;
                    }
                }
            }

            make(name);
        }
        else {
            let alphabets = 'abcdefghijklmnopqrstuvwxyz'
            let name = '';

            for (let i = 0; i < 7; i += 1) {
                let ranNum = Math.floor(Math.random() * alphabets.length);
                name += (Math.random() >= 0.5 ? alphabets[ranNum].toUpperCase() : alphabets[ranNum]) + (Math.random() >= 0.5 ? ranNum : i);
            }

            name = name + (global.rooms.length + 1);
            make(name);
        }
    });

    socket.on('request', (value) => {
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

server.listen(process.env.PORT, function () {
    console.log('server is running ' + new Date());
});
