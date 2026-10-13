import { Router } from 'express';
import { authenticate, authenticatedCallback, refreshToken } from '../verification';

export const authRouter = Router();

authRouter.get('/refresh', refreshToken);
authRouter.get('/google', authenticate);
authRouter.get('/google/callback', authenticatedCallback);
