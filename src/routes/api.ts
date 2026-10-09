import express from 'express';
import { marketplaceOnboard } from '../actions/marketplace';
import { 
  checkout, 
  logout,
  submitOrder, 
  syncUsers, 
  webhook 
} from '../actions/main';

export const apiRouter = express.Router();

apiRouter.post('/logout', logout);
apiRouter.post('/sync-users', syncUsers);
apiRouter.post('/submit-order', submitOrder);
apiRouter.post('/checkout', checkout);
apiRouter.post('/seller/onboard', marketplaceOnboard);
apiRouter.post('/webhooks', webhook);

