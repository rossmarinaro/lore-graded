import { Request } from 'express'
import jwt from 'jsonwebtoken'

export interface MongoDBOptions {
    maxPoolSize: number;
    minPoolSize: number;
    maxIdleTimeMS: number;
} 

export interface Order {
  cards: string[]
  created_at: Date
};

interface Account {
  email: string;
  password: string;
  username: string; 
  phone: number;
};

export type UnAuthenticatedRequest = Request & Account;

export type AuthenticatedRequest = Request & {
  token?: string;
  _id?: string;
};

export type User = Account & {
  _id: string;
  paid: boolean;
  order: Order 
};

export type BinaryChoice = 0 | 1;

export interface UserJwtPayload extends jwt.JwtPayload {
  _id: string;
}