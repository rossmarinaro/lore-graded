import * as express from 'express';
import { ObjectId } from 'mongodb';

declare global {
  namespace Express {
    interface Request {
      _id?: ObjectId; 
      cookies: {
        session_id?: string;
        [key: string]: any;
      };
    }
  }
}
