import Model from "./model";

export default class Handle extends Model {

  static get tableName() {
    return 'handle';
  }

  static get tableKeys() {
    return 'id'
  }

}
