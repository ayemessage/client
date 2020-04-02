const io = require('socket.io-client')
const config = require("./config");
//const stash = require('stash')('/')
const db = require('./db')

// Holdover until real userid can be set

export class Store {
    constructor() {
        this.initStorage();
        this.connect();
    }

    initStorage() {
        this.db = db;
    }

    connect() {

        let userid = 'asdfg1234'//stash.get('userid');
        if (!userid) {
            console.error("User not logged in!")
            return;
        }

        if (this.socket) return this.socket;

        const socket = this.socket = io(config.url + '/user/' + userid);


        this.registerListeners();

        socket.open()
    }

    registerListeners() {

        let socket = this.connect();

        // Called whenever a new server connection is made
        socket.on('helloClient', (serverData) => {
            console.log(serverData);
            socket.emit('helloServer', this.getClientInfo());
        });


        // Called whenever a new client (or worker) connects to this message namespace
        socket.on('newClient', ({role, deviceName}) => {
            console.log(`New ${role}: ${deviceName} is on this message queue`);
        });


        // This is when a message is sent from another ayeMesage device, to be sent by Messages
        socket.on('sendMessage', (data) => {

        })

        // This is when a message, originating from ayeMessage, is confirmed to be sent by Messages
        socket.on('messageSent', (data) => {

        })

        // This is when a new message appears inside of iMessage (whether sent by me, in ayeMessage, or received from another person)
        socket.on('receivedMessage', (data) => {

        })

        // Received when message history data is received, normally at our request
        socket.on('messageHistory', (data) => {

        })

        // Sent when another device is requesting message logs.  We should listen for a specific flag, because other
        // devices may request logs from the Worker OR from other clients depending on whether it can get ahold of the Worker or not
        socket.on('messageHistoryRequest', (data) => {

        })
    }

    /**
     * Gives us an inventory of locally known data for sharing to other nodes
     */
    getClientInfo() {

        // Discover who we are
        let clientInfo = {};

        // Is this an electron app or no?
        if (window.require) {
            let os = window.require('os');
            clientInfo = {
                deviceName: os.hostname(),
                os: {
                    arch: os.arch(),
                    platform: os.platform(),
                    version: os.version()
                },

            }

        } else {
            clientInfo = {
                deviceName: false,//store.get('deviceName'),
                os: {
                    platform: navigator.userAgent,
                    version: navigator.appName
                }
            }
        }
        if (!clientInfo.deviceName) {
            clientInfo.deviceName = "browser-" + (new Date()).getTime();
            //store.set('deviceName', clientInfo.deviceName)
        }

        clientInfo.role = 'client';

        return clientInfo;
    }


}

let store = new Store();
export default store;