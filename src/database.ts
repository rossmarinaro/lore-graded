require('dotenv').config();

import { InsertOneResult, MongoClient, WithId } from 'mongodb';
import { User } from './types';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export class Database {

    private static clientPromise: Promise<MongoClient>
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
            console.log(`connection to database failed: ${ error }`);
        }
    }

    public static async connect(): Promise<MongoClient>
    {
        const connection = await MongoClient.connect(process.env.MONGODB_ATLAS_URI as string, this.options); 

        console.log(connection ? `connection to database ${ process.env.MONGODB_DATABASE } successful.` : `cannot connect to database: ${ process.env.MONGODB_DATABASE }`);
        
        return connection;
    }

    public static async findOne(options: User): Promise<WithId<User> | null> {
        const user = await this.client.db(process.env.MONGODB_DATABASE).collection<User>(process.env.MONGODB_COLLECTION as string).findOne(options);
        return user;
    }

    public static async findAll(limit = -1, options: User): Promise<WithId<User>[]> {
        const cluster = await this.client.db(process.env.MONGODB_DATABASE).collection<User>(process.env.MONGODB_COLLECTION as string).find(options).limit(limit).toArray();
        return cluster;
    }

    public static async findOneAndUpdate(queryParams: User, updateParams: User, upsert = false): Promise<WithId<User> | null>
    {
        const user = await this.client.db(process.env.MONGODB_DATABASE).collection<User>(process.env.MONGODB_COLLECTION as string).findOneAndUpdate(
            queryParams, 
            { $set: updateParams }, 
            { returnDocument: 'after', projection: { password: 0 }, upsert }
        );

        return user;
    }

    public static async insertOne(insertParams: User): Promise<InsertOneResult<User>> {
        const user = await this.client.db(process.env.MONGODB_DATABASE).collection<User>(process.env.MONGODB_COLLECTION as string).insertOne(insertParams);
        return user;
    }
};

