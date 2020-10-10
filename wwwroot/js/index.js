var socket = io();

socket.on('connect', function () {
    var name = prompt('welcome,');

    if (!name)
        name = 'anonymous';

    socket.emit('enter', name);
});

socket.on('update', function (data) {
    console.log(`${data.name}: ${data.message}`);
});

function send() {
    var $input = document.getElementById('test');
    var message = $input.value;
    $input.value = '';
    socket.emit('message', { type: 'message', message: message });
}