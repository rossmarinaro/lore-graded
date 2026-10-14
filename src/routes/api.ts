import { Router } from 'express';
import { marketplaceOnboard } from '../actions/marketplace';
import { 
  logout,
  submitOrderToQueue, 
  //syncUser
} from '../actions/main';

export const apiRouter = Router();

apiRouter.post('/logout', logout);
//apiRouter.post('/sync-user', syncUser);
apiRouter.post('/submit-order', submitOrderToQueue);
apiRouter.post('/seller/onboard', marketplaceOnboard);


