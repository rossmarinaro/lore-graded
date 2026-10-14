import { Router } from 'express';
import { checkoutPaymentHook, gamePaymentHook } from '../actions/main';

export const webhookRouter = Router();

webhookRouter.post('/checkout-payment', checkoutPaymentHook);
webhookRouter.post('/game-payment', gamePaymentHook);