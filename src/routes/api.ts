import { Router } from 'express';
import { marketplaceOnboard } from '../actions/marketplace';
import { 
  logout,
  submitOrderToQueue
} from '../actions/main';

export const apiRouter = Router();

apiRouter.post('/logout', logout);
apiRouter.post('/submit-order', submitOrderToQueue);
apiRouter.post('/seller/onboard', marketplaceOnboard);


