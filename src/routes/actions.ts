import { Database } from '../database'
import { Request, Response } from 'express'
import { AuthenticatedRequest, UnAuthenticatedRequest, User, UserJwtPayload } from '../types'
import argon2 from 'argon2'
import jwt, { VerifyErrors } from 'jsonwebtoken'
import { sendNotification } from '../notification'
import { stripe } from '../config/stripe.js'

export async function createUser (req: Request<Record<string, never>, unknown, UnAuthenticatedRequest>, res: Response) 
{
  try 
  {
    const { username, password, email, phone } = req.body;

    const account = await Database.findOne({ email: req.body.email }, 1);

    if (!account)
    {
      const user = { 
        _id: '',
        username, 
        password,
        email, 
        phone, 
        paid: false,
        order: { cards: [], created_at: new Date() }
      };

      const entry = await Database.insertOne(user);

      res.status(200).json({ success: entry.acknowledged });
    }

    res.status(401).json({ success: false });

  }
  catch (error) {
    res.status(500).json({ success: false });
  }
}


//----------------------------------

export async function login (req: Request<Record<string, never>, unknown, UnAuthenticatedRequest>, res: Response) 
{
  try {

    const account = await Database.findOne({ email: req.body.email }, 1);

    if (account) 
    {
      const passwordIsValid = await argon2.verify(account.password, req.body.password);
      
      if (!passwordIsValid) 
        return res.status(401).json({ error: 'Invalid email or password.' });

      jwt.sign({ _id: account._id }, process.env.JWT_SIGN_IN as string, (err: Error | null, webtoken: string | undefined) => {

        if (err)
          res.status(500).json({ message: err });

        else {
            res.json({ webtoken });
            console.log('Account', account.username, account._id, 'logged in.');
        }
        res.status(200).json({ success: true });
      });
    }
    else
      res.status(401).json({ success: false });
  }
  catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

//----------------------------------------------------


export async function submitOrder (req: AuthenticatedRequest, res: Response)  
{
  try {

    jwt.verify(req.body.webtoken, process.env.JWT_SIGN_IN as string, async (err: VerifyErrors | null, authData: unknown) => { 

      if (err || !authData) {
        console.log(`jwt.verify() failed: ${ err }`); 
        res.json({ error: 'Access denied!' });
        return;
      }

      const data = authData as UserJwtPayload;
      const _id = data._id;
      const account = await Database.findOneAndUpdate({ _id }, { _id, order: req.body.order }, 0, 1);

      if (account)
      {
        sendNotification(account, 'submit order')
          .then(email => console.log('email sent: ', email))
          .catch(console.error);

        res.status(200).json({ success: true });
      }
      
    });

  }
  catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }

}


//-----------------------------------------------


export async function checkout (req: Request, res: Response) 
{ 
  try {

    const account = await Database.findOne({ _id: req.body.id }, 0, 1);

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
}


//----------------------------------



export async function webhook (req: Request, res: Response) 
{ 
  try {

    const event = req.body, 
          webhookSession: User = JSON.parse(event.data.object.metadata[0]); 

    switch (event.type) 
    {
      case 'checkout.session.completed':

        const _id = webhookSession._id;
        const account = await Database.findOneAndUpdate({ _id }, { _id, paid: true }, 0, 1);

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
}