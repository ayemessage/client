export default class Chat {

    static get tableName() {
        return 'chat';
    }

    static get tableKeys() {
        return 'id,chat_identifier'
    }

}