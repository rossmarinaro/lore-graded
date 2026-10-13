import { Router } from 'express';
import { paymentHook } from '../actions/main';

export const webhookRouter = Router();

webhookRouter.post('/payment', paymentHook);