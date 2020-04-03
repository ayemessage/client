/**
 * @param id
 * @param message.guid
 * @param text
 * @param handle_id
 * @param message.service
 * @param account
 * @param date
 * @param date_read
 * @param is_delivered
 * @param is_finished
 * @param is_from_me
 * @param is_read
 * @param is_sent
 * @param payload_data
 */

export default class Message {


    static get tableName() {
        return 'message';
    }

    static get tableKeys() {
        return 'id,chat_id,handle_id,tracking_id'
    }

    /**
     * Get the most recent message in our local DB
     * @returns {Message|null}
     */
    static getLastMessage() {
        return this.db.message.orderBy('date', 'DESC').limit(1);
    }
}