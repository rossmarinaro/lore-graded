import { Request } from 'express'
import jwt from 'jsonwebtoken'

export interface MongoDBOptions {
  maxPoolSize: number;
  minPoolSize: number;
  maxIdleTimeMS: number;
} 

export interface Order {
  order_id: string; //sql id
  time_stamp: Date;
};

interface Account {
  email: string;
  password: string;
  phone: string;
};

export type UnAuthenticatedRequest = Request & Account;

export interface CustomRequest extends Request {
  _id?: string; 
}

export interface AuthenticatedRequest extends Request {
  _id: string; 
}

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

export type User = Account & {
  _id: string;
  paid: boolean;
  orders: Order[];
};

export interface UserJwtPayload extends jwt.JwtPayload {
  _id: string;
}

export type EmailContextType = 'submit' | 'purchase.complete';