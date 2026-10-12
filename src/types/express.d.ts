import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      _id?: string; 
      cookies: {
        session_id?: string;
        [key: string]: any;
      };
    }
  }
}
