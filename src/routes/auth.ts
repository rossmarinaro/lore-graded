import express from 'express';
import { authenticate, authenticatedCallback } from '../verification';

export const authRouter = express.Router();

authRouter.get('/auth/google', authenticate);
authRouter.get('/auth/google/callback', authenticatedCallback);
