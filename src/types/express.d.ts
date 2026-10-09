import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      _id?: string; 
      cookies: {
        token?: string;
        [key: string]: any;
      };
    }
  }
}
