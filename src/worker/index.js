import {schedule} from 'node-cron';
import {checkFrequency} from '../config';
import MessagesDb from './messagesDb'

/**
 * This is the magic file, that interfaces the Messages application
 *
 * @param isWorker  {boolean}  Whether or not this client is actually a worker
 * @param dataflow  {Dataflow}
 * @param
 */
export default class Worker {

    /**
     *
     * @param dataflow {Dataflow}
     * @param db       {DB}
     * @returns        {boolean}
     */
    constructor({dataflow, db}) {
        Object.assign(this, arguments[0]);

        this.isWorker = this.checkIfWorker();
        if (!this.isWorker) return console.log("This is NOT a registered worker");
        console.log("Registering application as a worker!")
        this.messagesApi = window.require('osa-imessage');
        this.messagesDb = new MessagesDb(this);

        this.scheduleWatchMessages();

    }

    /**
     * Checks whether or not this client is in fact a worker or not
     * @returns {boolean}
     */
    checkIfWorker() {
        if (window.require && window.require('os').platform() === 'darwin') return this.isWorker = true;
        return false;
    }

    /**
     * Schedule a cron to watch for messages
     */
    scheduleWatchMessages() {
        this.cronJob = schedule(checkFrequency, this.checkNewMessages.bind(this), {});
    }

    /**
     * Fired on cron to see if any new messages have arisen
     */
    async checkNewMessages() {

        try {
            await this.messagesDb.connect();
            let messages = await this.messagesDb.getMessagesSince()

            if (!messages.length) return false;

            // If we have new messages push them out
            // @TODO will need to abstract this out so we can notify locally, globally, and mesh
            let data = await this.getSupportingMessageData(messages, {alert: true});
            this.dataflow.socket.emit('receivedMessages', data);
            this.dataflow.onReceivedMessages(data);
        } catch (e) {
            console.error(e);
        }

    }

    /**
     * A request from ayeMessage to send a new message via Messages
     *
     * @param chat_identifier {string}  The unique identifier for this chat session
     * @param text            {string}  The body of the message to be sent
     * @param attachments     {[{}]}    Any attachments to include (currently unsupported)
     * @param tracking_id     {string}  A unique ID assigned to this message, for tracking within ayeMessage until finally sent and given it's final ID/GUID
     */
    sendMessage({chat_identifier, text, attachments, tracking_id}) {
        // @TODO: Support attachments
        return this.messagesApi.send(chat_identifier, text)
    }

    /**
     * Retrieve all messages and subsequent groups created since lastDate, bearing in mind that this will go out chunked
     * so that we do not send out a gigantic single message with more data than can be reasonably processed (I have 1/2 million
     * messages in my DB for example)
     * @param lastDate      {Date|int}  Date to update since
     * @param emitter       {Function}  Function to use when we have data to send out
     * @returns Promise<{chats: [Chat], messages: [Message]}>
     */
    async getMessageHistory({lastDate}, emitter) {

        await this.messagesDb.connect();
        let messages = [true];
        while (messages.length > 0) {

            // Get new messages
            console.log(lastDate)
            messages = await this.messagesDb.getMessagesSince(lastDate)
            console.log(messages);
            if (messages.length) {
                // Push up the next date
                messages.forEach(m => m['_cocoa_date'] > lastDate ? lastDate = m['_cocoa_date'] : false);
                emitter(await this.getSupportingMessageData(messages, {expectMore: true}));
            } else emitter({messages: [], chats: [], handles: [], expectMore: false})

        }

    }

    /**
     * Since we have no easy way to track when a new chat has popped in, we have to rely on derived information from
     * messages to determine that. So the function is to check for new messages, if one appears, then we gather all
     * supporting handles, etc and send them along with the message packet.
     * @param messages          {[Message]}     The new/relevant messages
     * @param additionalInfo    {{*}=}          Any other info you might want to include in the object
     * @returns {{handles: [Handle], chats: [Chat], messages: [Message]}}
     */
    async getSupportingMessageData(messages, additionalInfo) {

        if (!additionalInfo) additionalInfo = {};

        if (!messages || !messages.length) return {...additionalInfo, messages, chats: [], handles: []}

        let chat_ids = [...new Set(messages.map(m => m.chat_id))];
        let handle_ids = [...new Set(messages.map(m => m.handle_id))];
        return {
            ...additionalInfo,
            messages,
            chats: await this.messagesDb.getChats(chat_ids),
            handles: await this.messagesDb.getHandles({chat_ids, handle_ids})
        }

    }

}