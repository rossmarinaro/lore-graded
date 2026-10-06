import express from 'express';
import { authenticate, authenticatedCallback, verifyAuth } from './verification';
import { 
  checkout, 
  logout,
  submitOrder, 
  webhook 
} from './actions';

export const endpointRouter = express.Router();

endpointRouter.post('/logout', logout);
endpointRouter.get('/auth/google', authenticate);
endpointRouter.get('/auth/google/callback', authenticatedCallback);
endpointRouter.post('/submit-order', verifyAuth, submitOrder);
endpointRouter.post('/checkout', verifyAuth, checkout);
endpointRouter.post('/webhooks', webhook);
 
