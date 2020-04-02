const io = require('socket.io-client')
const Store = require('electron-store');
const config = require("./src/config");

const store = new Store();
let userid = false;

if (userid = store.get('userid')) {

    const socket = io(config.url + '/socket.io/user/' + userid);

    let time = new Date();

    console.log(`I am: ${time}`)

    socket.on('helloClient', (a, b, c) => {
        console.log(a, b, c);
        socket.emit('helloServer', {
            role: 'worker',
            deviceName: time
        });
    });
    socket.on('newClient', (a, b, c) => {
        console.log("New Client ", a, b, c);
    });

    socket.open()

}
