import { InsertOneResult, MongoClient, WithId } from 'mongodb'
import { Account, MongoDBOptions } from './types/types'

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export class Database {

    private static clientPromise: Promise<MongoClient>
    public static client: MongoClient

    private static options: MongoDBOptions = { 
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 30000
    }

    public static async init()
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
            console.error('connection to database failed: ', error);
        }
    }

    public static async findOne(collection: string, options: Object, projection = {}): Promise<WithId<Account> | null> {
        const user = await this.client.db(process.env.MONGODB_DATABASE).collection<Account>(collection).findOne(options, { projection });
        return user;
    }

    public static async findAll(collection: string, limit = -1, options: Account): Promise<WithId<Account>[]> {
        const cluster = await this.client.db(process.env.MONGODB_DATABASE).collection<Account>(collection).find(options).limit(limit).toArray();
        return cluster;
    }

    public static async findOneAndUpdate(collection: string, queryParams: Object, updateParams: Object, projection = {}, upsert = false): Promise<WithId<Account> | null> 
    {
        const user = await this.client.db(process.env.MONGODB_DATABASE).collection<Account>(collection).findOneAndUpdate(
            queryParams, 
            { $set: updateParams },   
            { 
                returnDocument: 'after', 
                projection, 
                upsert 
            }
        );
        return user;
    }

    public static async insertOne(options: Account): Promise<InsertOneResult<Account>> {
        const user = await this.client.db(process.env.MONGODB_DATABASE).collection<Account>(process.env.MONGODB_COLLECTION as string).insertOne(options);
        return user;
    }
};

