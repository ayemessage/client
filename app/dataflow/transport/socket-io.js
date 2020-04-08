import * as io from 'socket.io-client'
import {EventEmitter} from "events"
import Encryption from "../encryption";


export default class SocketIOTransport extends EventEmitter {

  constructor({dataflow}) {
    super();
    Object.assign(this, arguments[0]);

    // Configure our encryption for this channel
    this.encryption = new Encryption(Object.assign(
      {},
      this.dataflow.config.encryption.base,
      this.dataflow.config.encryption.data
    ))
  }

  /**
   * Connect to socket provider and make sure we are all connected
   * @param userId
   */
  connect({userId}) {


    return this;
    this.socket = io(this.dataflow.config.url + '/user/' + userId);

    this.socket.on('helloClient', (serverData) => {
      console.log(serverData);
      this.socket.emit('helloServer', this.dataflow.getClientInfo());
      this.dataflow._emit('transportConnected', {transport: this})
    });

    this.socket.on('d', this.receive.bind(this));

    this.socket.open();

    return this;
  }

  /**
   * Send an encrypted transmission out to socket network
   * @param event
   * @param args
   */
  transmit(event, args) {
    if(!this.socket) return;
    // @TODO: Encrypt packet data
    console.log('sending', event, args);
    let payload = this.encryption.encrypt({event, args});
    this.socket.emit('d', payload)
  }

  /**
   * Receive encrypted packet decode and distrubite
   * @param payload
   */
  receive(payload) {
    // @TODO: Decrypt packet data
    let data = this.encryption.decrypt(payload);
    console.log('recieved', data);
    this.dataflow._emit(...data)
  }

  /**
   * We have received an event from dataflow
   * @param event
   * @param args
   * @returns {boolean}
   */
  emit(event, ...args) {
    this.transmit(event, args);
    return super.emit(event, ...args);
  }

}
