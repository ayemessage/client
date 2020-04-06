import Dexie from 'dexie'

const config = require("./config");

// const db = new Dexie();

const models = [
    require('./models/chat').default,
    require('./models/handle').default,
    require('./models/message').default,
    require('./models/setting').default
]


export class DB extends Dexie {
    constructor() {
        super(config.dbName);

        this.setupSchemas();
    }

    setupSchemas() {
        let schema = {}
        models.forEach(model => {
            schema[model.tableName] = model.tableKeys;
            //this[model.tableName] = model;
        })

        console.log(schema);

        this.version(2).stores(schema);

        models.forEach(model => {
            this[model.tableName].mapToClass(model);
            model.db = this;
        })

    }

}

let dbInit = new DB();

export default dbInit;