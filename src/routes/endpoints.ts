import express from 'express';
import { verifyToken } from '../verification.js';
import { checkout, createUser, login, submitOrder, webhook } from './actions.js';

export const endpointRouter = express.Router();

endpointRouter.post('/create-user', createUser);
endpointRouter.post('/login', login);
endpointRouter.post('/submit-order', verifyToken, submitOrder);
endpointRouter.post('/checkout', checkout);
endpointRouter.post('/webhooks', webhook);



