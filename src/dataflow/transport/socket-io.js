import * as io from 'socket.io-client'
import {EventEmitter} from "events";

export default class SocketIOTransport extends EventEmitter {

    constructor({dataflow}) {
        super();
        Object.assign(this, arguments[0])
    }

    /**
     * Connect to socket provider and make sure we are all connected
     * @param userId
     */
    connect({userId}) {


        this.socket = io(this.dataflow.config.url + '/user/' + userId);

        this.socket.on('helloClient', (serverData) => {
            console.log(serverData);
            this.socket.emit('helloServer', this.dataflow.getClientInfo());
            this.dataflow._emit('transportConnected', {transport: this})
        });

        this.socket.on('d', this.receive.bind(this));

        this.socket.open()

        return this;
    }

    /**
     * Send an encrypted transmission out to socket network
     * @param event
     * @param args
     */
    transmit(event, args) {
        // @TODO: Encrypt packet data

        this.socket.emit('d', {event, args})
    }

    /**
     * Receive encrypted packet decode and distrubite
     * @param event
     * @param args
     */
    receive({event, args}) {
        // @TODO: Decrypt packet data

        this.dataflow._emit(event, ...args)
    }

    /**
     * We have received an event from dataflow
     * @param event
     * @param args
     * @returns {boolean}
     */
    emit(event, ...args) {
        this.transmit(event, args)
        return super.emit(event, ...args);
    }

}