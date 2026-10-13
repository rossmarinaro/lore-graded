import { Router } from 'express';
import { authenticate, authenticatedCallback, authToken, refreshToken } from '../verification';

export const authRouter = Router();

authRouter.get('/refresh', refreshToken);
authRouter.get('/google', authenticate);
authRouter.get('/google/callback', authenticatedCallback);
authRouter.get('/oauth/token', authToken);