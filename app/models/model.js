export default class Model {

  constructor() {

  }

  static get tableName() {
    return this.name.toLowerCase();
  }

  static get tableKeys() {
    return 'id'
  }

  static query() {
    return this.db[this.tableName];
  }


}
