import express from 'express';
import { marketplaceOnboard } from '../actions/marketplace';
import { 
  checkout, 
  logout,
  submitOrderToQueue, 
  syncUsers, 
  webhook 
} from '../actions/main';

export const apiRouter = express.Router();

apiRouter.post('/logout', logout);
apiRouter.post('/sync-users', syncUsers as unknown as express.RequestHandler);
apiRouter.post('/submit-order', submitOrderToQueue as unknown as express.RequestHandler);
apiRouter.post('/checkout', checkout as unknown as express.RequestHandler);
apiRouter.post('/seller/onboard', marketplaceOnboard);
apiRouter.post('/webhooks', webhook);

