import {EventEmitter} from "events"
import Encryption from "../encryption";
import {Publisher, Subscriber} from 'cote'

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


    // @TODO: Convert to encrypted channel ID
    this.channel = userId;


    this.publisher = new Publisher({
      name: userId,
      // namespace: 'rnd',
      // key: 'a certain key',
      broadcasts: [this.channel],
    });


    this.subscriber = new Subscriber({
      name: userId,
      // namespace: 'rnd',
      // key: 'a certain key',
      subscribesTo: [this.channel],
    });

    this.subscriber.on(this.channel, (data) => {
      this.receive(data);
    });

    console.log("Discovery Started");

    return this;
  }

  /**
   * Send an encrypted transmission out to socket network
   * @param event
   * @param args
   */
  transmit(event, args) {
    // @TODO: Encrypt packet data
    //let payload = this.encryption.encrypt({event, args});
    let payload = {event, args};
    console.log('sending [local]', payload);
    this.publisher.publish(this.channel, payload)
  }

  /**
   * Receive encrypted packet decode and distrubite
   * @param payload
   */
  receive(payload) {
    // @TODO: Decrypt packet data
    //let data = this.encryption.decrypt(payload);
    let data = payload;
    console.log('recieved [local]', data);
    this.dataflow._emit(data.event, ...data.args)
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
