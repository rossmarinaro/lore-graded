require('dotenv').config();

import { MongoClient } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export class Database {

    public static clientPromise: Promise<MongoClient>
    public static client: MongoClient
    public static options: {
        useUnifiedTopology: boolean;
        maxPoolSize: number;
        minPoolSize: number;
        maxIdleTimeMS: number;
    } = { 
        useUnifiedTopology: true,
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 30000
    };

    static async init()
    { 
        try {

            //init and cache mongodb client

            if (process.env.NODE_ENV === 'development') 
            {
                if (!global._mongoClientPromise) {
                    this.client = new MongoClient(process.env.MONGODB_ATLAS_URI as string, this.options);
                    global._mongoClientPromise = this.client.connect(); 
                }
                this.clientPromise = global._mongoClientPromise;
            } 
            else 
                this.clientPromise = new MongoClient(process.env.MONGODB_ATLAS_URI as string, this.options).connect();
            
            this.client = await this.clientPromise;

            //rate-limiting time to live index

            await this.client.db(process.env.MONGODB_DATABASE).collection('temp').createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 });
        }
        catch (error) {
            console.log(`connection to database failed: ${ error }`);
        }
    }

    static async connect(): Promise<MongoClient>
    {
        const connection = await MongoClient.connect(process.env.MONGODB_ATLAS_URI as string, this.options); 

        console.log(connection ? `connection to database ${ process.env.MONGODB_DATABASE } successful.` : `cannot connect to database: ${ process.env.MONGODB_DATABASE }`);
        
        return connection;

    }

    static async query(collection: string, options = {}) {
        const user = await this.client.db(process.env.MONGODB_DATABASE).collection(collection).findOne(options);
        return user;
    }

    static async queryAll(collection: string, limit = -1, options = {}): Promise<Object>  {
        const cluster = await this.client.db(process.env.MONGODB_DATABASE).collection(collection).find(options).limit(limit).toArray();
        return cluster;
    }

    static async updateOne(collection: string, queryParams: Object, updateParams: Object) {
        const user = await this.client.db(process.env.MONGODB_DATABASE).collection(collection).findOneAndUpdate(
            queryParams, 
            { $set: updateParams }, 
            { returnDocument: 'after', projection: { password: 0 } /*, upsert: true */ }
        );

        return user;
    }

    static async insertOne(collection: string, insertParams: Object): Promise<Object>  {
        const user = await this.client.db(process.env.MONGODB_DATABASE).collection(collection).insertOne(insertParams);
        return user;
    }
};

