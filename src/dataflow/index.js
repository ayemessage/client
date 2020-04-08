import db from '../db'
import Worker from './worker'
import * as config from '../config'
import {v4 as uuidv4} from 'uuid';
import {EventEmitter} from "events";
import SocketIOTransport from "./transport/socket-io";

/**
 * This is the class that is in charge of ensuring our data is valid throughout the application
 */
export class DataFlow extends EventEmitter {
    constructor(userConfig) {
        super();

        this.config = Object.assign({}, config, userConfig || {})
        this.worker = new Worker({dataflow: this, db});
        this.initStorage();
        this.connection = this.connect();
    }

    initStorage() {
        this.db = db;
    }

    async connect() {

        // @TODO: Need to get actual userids and authentication going
        let userId = 'asdfg1234' //stash.get('userid');
        if (!userId) {
            console.error("User not logged in!")
            return;
        }

        if (this.connection) return this.connection;


        this.registerListeners();

        // Here we loop over all our transports, instantiate them, start connection and wait for them to complete
        this.transports = await Promise.all(
            [SocketIOTransport].map(t => (new t({dataflow: this})).connect({userId}))
        )


    }

    /**
     * We are overriding the core emit function to ensure that data that is generally emitted to dataflow is also
     * broadcast to other nodes
     * @param event
     * @param args
     * @returns {*}
     */
    emit(event, ...args) {
        this.transports.forEach(t => t.emit(event, ...args));
        return this._emit(event, ...args);
    }

    /**
     * Private emit to ONLY emit internally, generally used by transport's to avoid recursive loops
     * @param event
     * @param args
     * @returns {boolean}
     * @private
     */
    _emit(event, ...args) {
        return super.emit(event, ...args);
    }


    async updateHistory() {
        console.log(db);
        let lastMessage = await db.message.schema.mappedClass.getLastMessage();
        console.log(lastMessage)
        let lastDate = lastMessage ? lastMessage._cocoa_date : (new Date(2002, 1, 1, 0, 0, 0)).getTime();

        let requestData = {lastDate, deviceName: this.getClientInfo().deviceName, requestId: uuidv4()};
        this.emit('messageHistoryRequest', requestData);
        //this.onMessageHistoryRequest(requestData);
    }

    registerListeners() {


        // Called whenever a new, call an update history check sync upon a new connection is made
        this.on('transportConnected', this.updateHistory.bind(this));

        // Called whenever a new client (or worker) connects to this message namespace
        this.on('newClient', ({role, deviceName, transport}) => {
            console.log(`New ${role}: ${deviceName} is on this message queue via ${transport}`);
        });

        this.on('sendMessage', this.onSendMessage.bind(this));
        this.on('messageSent', this.onMessageSent.bind(this));
        this.on('receivedMessages', this.onReceivedMessages.bind(this));
        this.on('messageHistoryRequest', this.onMessageHistoryRequest.bind(this));

    }

    /**
     * Gives us an inventory of locally known data for sharing to other nodes
     */
    getClientInfo() {

        if (this.clientInfo) return this.clientInfo;
        // Discover who we are
        let clientInfo = {};

        // Is this an electron app or no?
        if (window.require) {
            let os = window.require('os');
            clientInfo = {
                deviceName: os.hostname(),
                os: {
                    arch: os.arch(),
                    platform: os.platform()
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

        clientInfo.role = ['client'];

        if (this.worker.isWorker) clientInfo.role.push('worker');

        return this.clientInfo = clientInfo;
    }


    /**
     * This is what you will hit to actually send a message
     *
     * @param chat_identifier {string}  The unique identifier for this chat session
     * @param text            {string}  The body of the message to be sent
     * @param attachments     {[{}]}    Any attachments to include (currently unsupported)
     */
    async sendMessage({chat_identifier, text, attachments}) {
        let data = arguments[0];
        data.tracking_id = uuidv4();
        this.emit('sendMessage', data)
    }

    /**
     * This is when a message is sent from another ayeMesage device, to be sent by Messages
     *
     * @param chat_identifier {string}  The unique identifier for this chat session
     * @param text            {string}  The body of the message to be sent
     * @param attachments     {[{}]}    Any attachments to include (currently unsupported)
     * @param tracking_id     {string}  A unique ID assigned to this message, for tracking within ayeMessage until finally sent and given it's final ID/GUID
     */
    async onSendMessage({chat_identifier, text, attachments, tracking_id}) {
        if (!this.worker.isWorker) return;
        let result = false;
        try {
            result = await this.worker.sendMessage(arguments[0]);
        } catch (e) {
            console.error(e);
        }
        this.emit('messageSent', {tracking_id, result});
        this.onMessageSent({tracking_id, result});
    }

    /**
     * This is when a message, originating from ayeMessage, is confirmed to be sent by Messages - note that this does NOT give us
     * the final message object, only that this has been sent successfully to the end Messages application.
     *
     * @param tracking_id     {string}  The unique internally tracked ID of the message sent
     * @param result          {boolean} Whether the message sent successfully or not
     */
    onMessageSent({tracking_id, result}) {
        // @TODO: check result, if failed, failures, etc.
        // @TODO: if message was sent from this device, if not populate here
    }

    /**
     * This is when a new message appears inside of iMessage (whether sent by me, in ayeMessage, or received from another person)
     *
     * @param messages      {[Message]} The new messages received
     * @param chats         {[Chat]}    When applicable, the chat data used to create the new record
     * @param handles       {[Chat]}  When applicable, any new handles
     * @param alert         {boolean}   Whether to alert for new message
     * @param expectMore    {boolean}   If this is a backload whether to expect more (probably delay re-painting)
     * @returns Promise<{[Chat|Message]}>
     */
    async onReceivedMessages({messages, chats, handles, expectMore, alert}) {
        let promises = [];

        console.log(arguments[0])


        if (messages && messages.length) {
            promises.push(db.message.bulkPut(messages));
        }
        if (chats && chats.length) {

            let messageBubble = messages.reverse();
            // Update last message
            chats.forEach(chat => {
                let lastMessage = messageBubble.find(m => m.chat_id == chat.id)
                if (!chat.last_message || lastMessage._cocoa_date > chat.lastMessage._cocoa_date) chat.last_message = lastMessage;
                if(chat.handle_ids) chat.handle_ids = chat.handle_ids.split(",").map(parseInt);

            })

            promises.push(db.chat.bulkPut(chats));
        }
        if (handles && handles.length) {
            promises.push(db.handle.bulkPut(handles));
        }

        await Promise.all(promises);

        let result = await Promise.all(promises);

        if (alert) {
            // @TODO: Notify application and user
        }

        if(!expectMore){
            if(chats) this.emit('chatsUpdated');
            if(messages) this.emit('messagesUpdated');
            this.emit('receivedUpdate');
        }

        return result;
    }


    /**
     * Sent when another device is requesting message logs.  We should listen for a specific flag, because other
     * devices may request logs from the Worker OR from other clients depending on whether it can get ahold of the Worker or not
     *
     * @param allowPeers    {boolean}  Whether to allow peer provided data history, typically when worker is offline
     * @param lastDate      {integer}  Timestamp of last message received
     * @param deviceName    {string}   Device requesting the history
     * @param requestId     {uuidv4}   UUID of the request being made
     */
    async onMessageHistoryRequest({allowPeers, lastDate, deviceName, requestId}) {
        if (!this.worker.isWorker) return;
        await this.worker.getMessageHistory({lastDate}, async data => {
            try {
                Object.assign(data, {
                    deviceName,
                    requestId
                })
                console.log("Sending ", data, lastDate);
                this.emit('receivedMessages', data);
                this.onReceivedMessages(data);
            } catch (e) {
                console.error(e)
            }
        })
    }


}

// @TODO: This could actually be pulled out and extracted into it's own module and them imported into the subseuqent apps (ie Desktop, and Mobile).
let dataflow = new DataFlow();
export default dataflow;
window.dataflow = dataflow;