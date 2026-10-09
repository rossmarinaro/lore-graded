import express from 'express';
import { authenticate, authenticatedCallback } from '../verification';

export const authRouter = express.Router();

authRouter.get('/google', authenticate);
authRouter.get('/google/callback', authenticatedCallback);
