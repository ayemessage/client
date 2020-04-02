export default class Chat {

    static get tableName() {
        return 'chat';
    }

    static get tableKeys() {
        return 'chat_id, group_name'
    }

}