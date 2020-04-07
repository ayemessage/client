// Removing this here as we want to use the electron compiled knex/sqllite
//import knex from 'knex'
import {historyChunkSize, messagesDbConnection} from '../config'

console.log(messagesDbConnection);

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

        this.knex = this.connection = await window.require("knex")({
            client: 'sqlite3',
            connection: messagesDbConnection,
            useNullAsDefault: true,
        });
        await this._primeLastMessage();
    }

    /**
     * Fetch the very last message in the DB so that we have a point of reference as to when to fetch new messages from
     * @private
     */
    async _primeLastMessage() {
        try {
            console.log("Getting latest message");
            let lastMessage = await this.connection
                .from('message')
                .orderBy('date', 'DESC')
                .limit(1)

            console.log("FETCHING MESSAGE", lastMessage);
            this.lastRetreivedMessage = lastMessage[0].date;
        } catch (e) {
            console.error(e)
        }
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
        if (attrs) {
            for (var i in time) {
                if (attrs.includes(i)) time[i] = this.convertFromAppleTime(time['_cocoa_' + i] = time[i])
            }
        }

        if (time > this.lastRetreivedMessage) this.lastRetreivedMessage = time;
        return new Date((time / Math.pow(10, 6)) + appleEpochBase);
    }

    /**
     * Convert a JavaScript timestamp to Cocoa
     * @param time      {int}
     * @returns         {Date}
     */
    convertToAppleTime(time) {
        if (!time) return time;
        return new Date((time * Math.pow(10, 6)) + appleEpochBase);
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
        if (date < Math.pow(10, 12)) return this.convertToAppleTime(date).getTime();

        return date;
    }

    getMessagesSince(date, strict) {
        date = this.getSuppliedDateStamp(date);
        let query = this.connection
            .from('message')
            .leftJoin('handle', 'message.handle_id', '=', 'handle.ROWID')
            .leftJoin('chat_message_join', 'message.ROWID', '=', 'chat_message_join.message_id')
            .select(['message.guid', 'text', 'handle_id', 'message.service', 'account', 'date', 'date_delivered', 'date_read', 'is_delivered', 'is_finished', 'is_from_me', 'is_read', 'is_sent', 'chat_message_join.chat_id'])
            .select({id: 'message.ROWID', sender: 'handle.id'})
            .where('message.date', '>', date)

        if (!strict) query = query.orWhere('message.date_read', '>', date)
            .orWhere('message.date_delivered', '>', date)

        return query.orderBy('date', 'ASC')
            .limit(historyChunkSize)
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

        return messages;
    }

    getChats(chat_ids) {
        let self = this;
        return this.connection
            .from('chat')
            //.leftJoin('chat_handle_join', 'chat_handle_join.chat_id', '=', 'chat.ROWID')
            .select(['chat.guid', 'chat_identifier', 'service_name', 'room_name', 'is_archived', 'last_addressed_handle', 'display_name', 'group_id'])
            .select({id: 'chat.ROWID', handle_ids: function(){
                return this
                    .from('chat_handle_join')
                    .select(self.knex.raw("GROUP_CONCAT(`handle_id`)"))
                    .whereRaw('chat_id=chat.ROWID')
                    .groupBy('chat_id')
            }})
            .whereIn('ROWID', chat_ids)
    }

    getHandles({chat_ids, handle_ids}) {
        return this.connection
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

    }

}