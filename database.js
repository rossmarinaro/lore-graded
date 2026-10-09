"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const mongodb_1 = require("mongodb");
class Database {
    static clientPromise;
    static client;
    static options = {
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 30000
    };
    static async init() {
        try {
            if (process.env.NODE_ENV === 'development') {
                if (!global._mongoClientPromise) {
                    this.client = new mongodb_1.MongoClient(process.env.MONGODB_ATLAS_URI, this.options);
                    global._mongoClientPromise = this.client.connect();
                }
                this.clientPromise = global._mongoClientPromise;
            }
            else
                this.clientPromise = new mongodb_1.MongoClient(process.env.MONGODB_ATLAS_URI, this.options).connect();
            this.client = await this.clientPromise;
            await this.client.db(process.env.MONGODB_DATABASE).collection('temp').createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 });
        }
        catch (error) {
            console.error('connection to database failed: ', error);
        }
    }
    static async findOne(collection, options, projection = {}) {
        const user = await this.client.db(process.env.MONGODB_DATABASE).collection(collection).findOne(options, { projection });
        return user;
    }
    static async findAll(collection, limit = -1, options) {
        const cluster = await this.client.db(process.env.MONGODB_DATABASE).collection(collection).find(options).limit(limit).toArray();
        return cluster;
    }
    static async findOneAndUpdate(collection, queryParams, updateParams, projection = {}, upsert = false) {
        const user = await this.client.db(process.env.MONGODB_DATABASE).collection(collection).findOneAndUpdate(queryParams, { $set: updateParams }, {
            returnDocument: 'after',
            projection,
            upsert
        });
        return user;
    }
    static async insertOne(options) {
        const user = await this.client.db(process.env.MONGODB_DATABASE).collection(process.env.MONGODB_COLLECTION).insertOne(options);
        return user;
    }
}
exports.Database = Database;
;
//# sourceMappingURL=database.js.map