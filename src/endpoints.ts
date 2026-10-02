import { Request, Response } from 'express';
import { stripe } from './config/stripe.js'; // Ensure correct path extension for NodeNext
import { Database } from './database.js';
import { sendNotification } from './notification.js';
import express from 'express';

export const router = express.Router();

//stripe checkout

router.post('/checkout', async (req: Request, res: Response) => { 
  try {

    const { username } = req.body.username;
    const account = await Database.query('accounts', { username });

    if (account)
    {
      const price = 100; //one dollar placeholder
      
      const metadata = { 
        username: account.username, 
        email: account.email, 
        phone: account.phone 
      };

      const stripeSession = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          success_url: window.location.origin, 
          cancel_url: window.location.origin,
          line_items: [
              {
                  price_data: { 
                      currency: 'usd',
                      product_data: {
                      name: 'loregraded',
                      },
                      unit_amount: price,
                  },
                  quantity: 1,
              }
          ],
          metadata
      });

      console.log( 
          'Checkout Success Link Generated: ', stripeSession.url, 
          '\nTotal: ', price, 
          '\nMetadata: ', JSON.stringify(metadata)
      );
        
      res.status(200).json({ url: stripeSession.url, session: req.body.session });
    }
    else 
      res.status(401).json({ error: 'Please create an account before checking out.' });
  } 
  catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});


//------------------------------------------

router.post('/webhooks', async (req: Request, res: Response) => { 

    try {

      const event = req.body, 
            webhookSession = JSON.parse(event.data.object.metadata[0]); 

      console.log('WEBHOOK METADATA: ', webhookSession);

      switch (event.type) 
      {
        case 'checkout.session.completed':

          const account = await Database.updateOne('accounts', { username: webhookSession.username }, { paid: true });

          if (account)
          {
            console.log('user paid. user: ' + account.username);
              
            //send confirmation email / SMS

            sendNotification(webhookSession, 'purchase complete')
                .then(email => console.log('email sent: ', email))
                .catch(console.error);
          }

        break;

        default: console.log(`Unhandled event type: ${event.type}`); 
        break;
      }
    }

    catch(err) {
      console.log(`There was a problem processing webhook: ${err}`);
    }

    res.json({ received: true });
});



