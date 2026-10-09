import { Router } from 'express';
import { marketplaceOnboard } from '../actions/marketplace';
import { 
  checkout, 
  logout,
  submitOrderToQueue, 
  syncUsers, 
  webhook 
} from '../actions/main';

export const apiRouter = Router();

apiRouter.post('/logout', logout);
apiRouter.post('/sync-users', syncUsers );
apiRouter.post('/submit-order', submitOrderToQueue);
apiRouter.post('/checkout', checkout);
apiRouter.post('/seller/onboard', marketplaceOnboard);
apiRouter.post('/webhooks', webhook);

