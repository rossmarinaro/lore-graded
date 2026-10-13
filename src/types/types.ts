import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb';

export interface MongoDBOptions {
  maxPoolSize: number;
  minPoolSize: number;
  maxIdleTimeMS: number;
} 

export interface Order {
  order_id: string; //sql id
  time_stamp: Date;
};

export interface SyncRequestBody {
  collection: string;
  documents: Array<{
    metadata: {
      originalSqlId: any;
      syncedAt: string;
      inferredIdKey: string;
    };
    data: Record<string, any>;
  }>;
}

export interface Account {
  _id?: ObjectId;
  email?: string;
  password?: string;
  phone?: string;
  paid?: boolean;
  orders?: Order[];
};

export interface UserJwtPayload extends jwt.JwtPayload {
  _id: string;
}

export type EmailContextType = 'submit' | 'purchase.complete' | 'purchase.offered';