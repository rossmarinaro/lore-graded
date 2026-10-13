import { Router } from 'express';
import { marketplaceOnboard } from '../actions/marketplace';
import { 
  logout,
  submitOrderToQueue, 
  syncUsers
} from '../actions/main';

export const apiRouter = Router();

apiRouter.post('/logout', logout);
apiRouter.post('/sync-users', syncUsers );
apiRouter.post('/submit-order', submitOrderToQueue);
apiRouter.post('/seller/onboard', marketplaceOnboard);


