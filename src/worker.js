/**
 * This is the magic file, that interfaces the Messages application
 *
 * @param isWorker  {boolean}  Whether or not this client is actually a worker
 * @param dataflow  {Dataflow}
 * @param
 */
class Worker {

    /**
     *
     * @param dataflow {Dataflow}
     * @param db       {DB}
     * @returns        {boolean}
     */
    constructor({dataflow, db}) {
        Object.assign(this, arguments[0])
        if (!this.checkIfWorker()) return this.isWorker = false;

        this.scheduleWatchMessages();

    }

    /**
     * Checks whether or not this client is in fact a worker or not
     * @returns {boolean}
     */
    checkIfWorker() {
        return true;
    }

    /**
     * Schedule a cron to watch for messages
     */
    scheduleWatchMessages() {

    }

    /**
     * Fired on cron to see if any new messages have arisen
     */
    checkNewMessages() {

    }

    /**
     * A request from ayeMessage to send a new message via Messages
     *
     * @param chat_identifier {string}  The unique identifier for this chat session
     * @param text            {string}  The body of the message to be sent
     * @param attachments     {[{}]}    Any attachments to include (currently unsupported)
     * @param tracking_id     {string}  A unique ID assigned to this message, for tracking within ayeMessage until finally sent and given it's final ID/GUID
     */
    async sendMessage({chat_identifier, text, attachments, tracking_id}) {

    }

    /**
     * Retrieve all messages and subsequent groups created since lastDate
     * @param lastDate
     * @returns Promise<{chats: [Chat], messages: [Message]}>
     */
    async getMessageHistory({lastDate}) {

    }

}