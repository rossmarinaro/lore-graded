import { Request, Response } from 'express';
import { stripe } from './config/stripe.js'; 
import { Database } from './database.js';
import { sendNotification } from './notification.js';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken'
import express from 'express';
import { User } from './types.js';
import { verifyToken } from './verification.js';

export const router = express.Router();

router.post('/create-user', async (req: Request, res: Response) => {

  try 
  {
    const { username, email, phone } = req.body;

    const account = await Database.findOne({ email: req.body.email });

    if (!account)
    {
      const user = { 
        username, 
        email, 
        phone, 
        paid: false 
      };

      const entry = await Database.insertOne(user);

      res.status(200).json({ success: entry.acknowledged });
    }

    res.status(401).json({ success: false });

  }
  catch (error) {
    res.status(500).json({ success: false });
  }
});


//------------------------------------------------- 


router.post('/login', verifyToken, async (req: Request, res: Response) => {

  try {

    const account = await Database.findOne({ email: req.body.email });

    if (account)
      jwt.sign({ data: account }, process.env.JWT_SIGN_IN as string, (err: Error | null, webtoken: string | undefined) => {

        if (err)
          res.status(500).json({ message: err });

        else {
            res.json({ webtoken });
            console.log('Account', account.username, account._id, 'logged in.');
        }
        res.status(200).json({ success: true });
      });
      
    else
      res.status(401).json({ success: false });
  }
  catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//------------------------------------------------- 

router.post('/submit-order', async (req: Request<Record<string, never>, unknown, User>, res: Response) => {

  try {
    const _id = req.body._id;
    const order = req.body.order;
    const account = await Database.findOneAndUpdate({ _id }, { _id, order });

    if (account)
    {
      sendNotification(account, 'submit order')
        .then(email => console.log('email sent: ', email))
        .catch(console.error);

      res.status(200).json({ success: true });
    }
  }
  catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }

});

//------------------------------------------------- stripe checkout

router.post('/checkout', async (req: Request, res: Response) => { 

  try {

    const account = await Database.findOne({ _id: req.body.id });

    if (account)
    {
      const metadata = {
        _id: account._id,
        username: account.username ?? null,
        email: account.email ?? null,
        phone: account.phone ?? null,
        paid: String(account.paid)
      }

      const price = 100; //one dollar placeholder

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
          '\nMetadata: ', JSON.stringify(account)
      );
        
      res.status(200).json({ url: stripeSession.url });
    }
    else 
      res.status(401).json({ error: 'Please create an account before checking out.' });
  } 
  catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//------------------------------------------

router.post('/webhooks', async (req: Request, res: Response) => { 

  try {

    const event = req.body, 
          webhookSession: User = JSON.parse(event.data.object.metadata[0]); 

    switch (event.type) 
    {
      case 'checkout.session.completed':

        const _id = webhookSession._id;
        const account = await Database.findOneAndUpdate({ _id }, { _id, paid: true });

        if (account)
        {
          console.log(`user paid. user: ${ account.username }`);
            
          //send confirmation email / SMS

          sendNotification(webhookSession, 'purchase complete')
              .then(email => console.log('email sent: ', email))
              .catch(console.error);
        }

      break;

      default: console.log(`Unhandled event type: ${ event.type }`); 
      break;
    }
  }

  catch(err) {
    console.log(`There was a problem processing webhook: ${ err }`);
  }

  res.json({ received: true });
});



