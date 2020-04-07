import Model from "./model";

export default class Chat extends Model {

    static get tableName() {
        return 'chat';
    }

    static get tableKeys() {
        return 'id,chat_identifier,last_message_date,last_message.date'
    }

    getChatName() {
        return this.room_name || this.display_name || this.chat_identifier;
    }

}