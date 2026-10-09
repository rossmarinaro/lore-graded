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

export interface AuthenticatedRequest extends Request {
    _id?: string;
    cookies: {
      token?: string;
      [key: string]: any;
    };
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

export interface Account {
  _id: string;
  email: string;
  password: string;
  phone: string;
  paid: boolean;
  orders: Order[];
};

export interface UserJwtPayload extends jwt.JwtPayload {
  _id: string;
}

export type EmailContextType = 'submit' | 'purchase.complete';