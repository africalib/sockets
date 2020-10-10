const express = require('express');
const socket = require('socket.io');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socket(server);
const fs = require('fs');
//const { response } = require('express');

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

io.sockets.on('connection', (socket) => {
    console.log('connected');

    socket.on('enter', () => {
        if (!global.number) {
            global.number = 1;
            socket.name = 'black'
        }
        else {
            global.number += 1;
            socket.name = 'white';
        }

        io.sockets.emit('update', {
            name: 'connect',
            player: socket.name,
            turn: 'black'
        });

        if (global.number > 1) {
            delete global.number;

            io.sockets.emit('update', {
                name: 'start'
            });
        }
    });

    socket.on('request', (data) => {
        //data.name = socket.name;
        console.log(data);
        //socket.broadcast.emit('update', data);
        io.sockets.emit('update', data);
    });

    socket.on('disconnect', () => {
        let value = 'closed: ' + socket.name;
        io.sockets.emit('update', {
            name: 'disconnect',
            val1: value
        });
    });
});

server.listen(8080, () => {
    console.log('server is running');
});