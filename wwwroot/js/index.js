var socket = io();

socket.on('connect', function () {
    var room = prompt('welcome,');

    socket.emit('enter', room);
});

socket.on('update', function (data) {
    console.log(data);
});

function send() {
    var $input = document.getElementById('test');
    var message = $input.value;
    $input.value = '';
    socket.emit('request', message);
}