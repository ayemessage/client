import {EventEmitter} from "events"
import Encryption from "../encryption";
import Discover from 'node-discover'

export default class LocalDiscoveryTransport extends EventEmitter {

  constructor({dataflow}) {
    super();
    Object.assign(this, arguments[0]);

    // Configure our encryption for this channel
    this.encryption = new Encryption({

      ...this.dataflow.config.encryption.base,
      ...this.dataflow.config.encryption.data
    })
  }

  /**
   * Connect to socket provider and make sure we are all connected
   * @param userId
   */
  connect({userId}) {


    this.discover = new Discover({
      key: this.encryption.hash(userId)
    })

    // @TODO: Convert to encrypted channel ID
    this.channel = userId;

    this.discover.join(this.channel, data => {
      this.receive(data);
    })


    this.discover.on("added", function (obj) {
      this.dataflow._emit('transportConnected', {transport: this})
    });

    this.discover.on("removed", function (obj) {
      console.log("A node has been removed.");
    });
    return this;
  }

  /**
   * Send an encrypted transmission out to socket network
   * @param event
   * @param args
   */
  transmit(event, args) {
    // @TODO: Encrypt packet data
    console.log('sending [local]', event, args);
    let payload = this.encryption.encrypt({event, args});
    this.discover.send(this.channel, payload)
  }

  /**
   * Receive encrypted packet decode and distrubite
   * @param payload
   */
  receive(payload) {
    // @TODO: Decrypt packet data
    let data = this.encryption.decrypt(payload);
    console.log('recieved [local]', data);
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
