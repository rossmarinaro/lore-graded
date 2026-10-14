import 'express-session';
import * as express from 'express';
import { ObjectId } from 'mongodb';

declare global {
  namespace Express {
    interface Request {
      id?: ObjectId; 
      session?: any;
      cookies: {
        session_id?: string;
        [key: string]: any;
      };
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId: string;
    email: string;
    oauthState: {
      state: string;
      redirect_uri: string;
    };
  }
}

