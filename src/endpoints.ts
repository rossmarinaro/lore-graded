import express from 'express';
import { authenticate, authenticatedCallback, verifyToken } from './verification';
import { 
  checkout, 
  createUser, 
  login, 
  logout,
  submitOrder, 
  webhook 
} from './actions';

export const endpointRouter = express.Router();

endpointRouter.post('/create-user', createUser);
endpointRouter.post('/login', login);
endpointRouter.post('/logout', logout);
endpointRouter.post('/submit-order', verifyToken, submitOrder);
endpointRouter.post('/checkout', checkout);
endpointRouter.post('/webhooks', webhook);
endpointRouter.get('/auth/google', authenticate);
endpointRouter.get('/auth/google/callback', authenticatedCallback);


