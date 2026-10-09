import { Request } from 'express'
import jwt from 'jsonwebtoken'

export interface MongoDBOptions {
  maxPoolSize: number;
  minPoolSize: number;
  maxIdleTimeMS: number;
} 

export interface Card {
  serial_number: string;
  type: string;
};

export interface PhysicalCard extends Card {
  grade: number;
};

export interface Order {
  type: string;
  cards: Card[];
  created_at: Date;
  recipient: string; 
  street_address: string;
  apartment: string;
  city: string;
  zip: string;
  state: string;
  country: string;
};

interface Account {
  email: string;
  password: string;
  phone: string;
};

export type UnAuthenticatedRequest = Request & Account;

export type AuthenticatedRequest = Request & {
  token?: string;
  _id?: string;
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

export type User = Account & {
  _id: string;
  paid: boolean;
  order: Order;
};

export interface UserJwtPayload extends jwt.JwtPayload {
  _id: string;
}

export type EmailContextType = 'submit' | 'purchase.complete';