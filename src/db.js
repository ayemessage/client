import Dexie from 'dexie'

const config = require("./config");

const db = new Dexie(config.dbName);

const models = [
    require('./models/chat').default
]


export class DB {
    constructor() {
        this.setup();
    }

    setup() {
        let schema = {}
        models.forEach(model => {
            schema[model.tableName] = model.tableKeys;
            this[model.tableName] = model;
        })

        console.log(schema);

        db.version(1).stores(schema);

    }

}

let dbInit = new DB();

export default dbInit;