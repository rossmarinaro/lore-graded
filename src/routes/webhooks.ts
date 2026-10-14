import { Router } from 'express';
import { checkoutPaymentHook, gamePaymentHook } from '../actions/webhooks';

export const webhookRouter = Router();

webhookRouter.post('/checkout-payment', checkoutPaymentHook);
webhookRouter.post('/game-payment', gamePaymentHook);