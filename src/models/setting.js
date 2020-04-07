import Model from "./model";

export default class Setting extends Model {


    static get tableName() {
        return 'setting';
    }

    static get tableKeys() {
        return 'id'
    }

}