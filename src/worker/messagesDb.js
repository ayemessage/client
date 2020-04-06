import knex from 'knex'
import {historyChunkSize, messagesDbConnection} from '../config'

const appleEpochBase = 978307200000;

/**
 * This is our interface to the Messages database.
 */
export default class MessagesDB {

    /**
     * Initialize the database with the worker class
     * @param worker    {Worker}
     */
    constructor(worker) {
        this.worker = worker;
        this.connection = this.connect();
        this.lastRetreivedMessage = 0;
    }

    /**
     * Initialize the connection to the DB and ensure it is running
     * @returns {Promise<Knex<TRecord, TResult>>}
     */
    async connect() {
        if (this.connection) return this.connection;

        return new Promise((resolve, reject) => {
            this.knex = knex({
                client: 'sqlite3',
                connection: messagesDbConnection,
                afterCreate: (conn, done) => {
                    resolve(this.connection = conn);
                }
            });
        })
    }

    /**
     * Convert from apple's non-standard "Cocoa Time" to a unix/JS timestamp and Date Object
     * @param time      {int|{}}                 The cocoa timestamp
     * @param attrs     {undefined|[string]=}    The props to convert
     * @returns {Date|{}}
     */
    convertFromAppleTime(time, attrs) {
        if (!time) return time;
        // If we are sent an object with props convert the props
        if (attrs) return time.map((value, index) => attrs.includes(index) ? this.convertFromAppleTime(time['_cocoa_' + index] = value) : value);

        if (time > this.lastRetreivedMessage) this.lastRetreivedMessage = time;
        return new Date((time / Math.pow(10, 6)) + appleEpochBase);
    }

    convertToAppleTime(time, attrs) {
        if (!time) return time;
        return new Date((time - appleEpochBase) * Math.pow(10, 6));
    }

    /**
     * Convert the provided timestamp in whatever form to a Cocoa Timestamp Integer
     * @param date          {int|Date}  Whatever date you got!
     * @returns {number}    {int}       Cocoa Timestamp
     */
    getSuppliedDateStamp(date) {
        // If non provided, we use last retreived date
        if (!date) {
            if (this.lastRetreivedMessage) return this.lastRetreivedMessage;
            else throw new Error("Temporary Error: We cannot check for new messages since last known message until we have a point of reference as to when the last message was.  Please standby until that message can be identified.")
        }

        // If it is a Date object get a timestamp
        if (date instanceof Date) date = date.getTime();

        // Check if its a unix timestamp or Cocoa
        if (date < Math.pow(10, 13)) return this.convertToAppleTime(date);

        return date;
    }

    getMessagesSince(date) {
        date = this.getSuppliedDateStamp(date);
        return this.connection
            .query()
            .from('message')
            .leftJoin('handle', 'message.handle_id', '=', 'handle.ROWID')
            .leftJoin('chat_message_join', 'message.ROWID', '=', 'chat_message_join.message_id')
            .select(['message.ROWID', 'message.guid', 'text', 'handle_id', 'message.service', 'account', 'date', 'date_delivered', 'date_read', 'is_delivered', 'is_finished', 'is_from_me', 'is_read', 'is_sent', 'payload_data', 'chat_message_join.chat_id'])
            .select({sender: 'handle.id'})
            .where('message.date', '>', date)
            .orWhere('message.date_read', '>', date)
            .orWhere('message.date_delivered', '>', date)
            .orderBy('date', 'ASC')
            .limit(historyChunkSize)
            .fetch()
            .then(this.postProcessMessages.bind(this));
    }

    /**
     * Perform database sanitization and processing on messages before we return the final result
     * @param messages  {[Message]}
     */
    postProcessMessages(messages) {
        messages.forEach(message => {
            this.convertFromAppleTime(message, ['date', 'date_delivered', 'date_read'])
        })
    }

    getChats(chat_ids) {
        return this.connection
            .query()
            .from('chat')
            //.leftJoin('chat_handle_join', 'chat_handle_join.chat_id', '=', 'chat.ROWID')
            .select(['chat.ROWID', 'chat.guid', 'chat_identifier', 'service_name', 'room_name', 'is_archived', 'last_addressed_handle', 'display_name', 'group_id'])
            .whereIn('ROWID', chat_ids)
            .fetch();
    }

    getHandles({chat_ids, handle_ids}) {
        return this.connection
            .query()
            .from('handle')
            //.leftJoin('chat_handle_join', 'chat_handle_join.chat_id', '=', 'chat.ROWID')
            .select({
                id: 'ROWID',
                sender: 'id',
            })
            .select(['country', 'service', 'person_centric_id'])
            .whereIn('ROWID', handle_ids)
            .orWhereIn('ROWID', function () {
                this.select('handle_id').from('chat_handle_join').whereIn('chat_id', chat_ids)
            })
            .fetch();

    }

}