require('dotenv').config();

import { Database } from '../database'
import { Request, Response } from 'express'
import { Order, Account, UserJwtPayload } from '../types/types'
import { sendNotification } from '../notification'
import { stripe } from '../stripe';
import jwt from 'jsonwebtoken'
import { getUserID } from '../utils';


//----------------------------------------------------


export async function logout (_req: Request, res: Response) 
{
  try {
    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    res.redirect(302, process.env.WEB_URL as string);
  }
  catch (error) {
    console.error('logout::Error: ', error);
    res.status(500).send('Internal Server Error');
  }
}


//-----------------------------------------------


export async function syncUser(req: Request, res: Response)
{ 
  const { syncToken } = req.body;

  try 
  {
    if (!process.env.CROSS_SERVICE_SECRET)
      throw new Error('CROSS_SERVICE_SECRET is not defined.');

    // 🔒 SECURE: Cryptographically verify that your frontend backend signed this token

    const decoded = jwt.verify(syncToken, process.env.CROSS_SERVICE_SECRET) as UserJwtPayload;

    const user = await Database.findOneAndUpdate(process.env.MONGODB_COLLECTION as string, { _id: getUserID(decoded._id) }, {}, {}, true); 

    //SESSION: Generate a standard session token for subsequent Render operations

    const renderSessionToken = jwt.sign({ userId: user?._id }, process.env.CROSS_SERVICE_SECRET, { expiresIn: '30d' });

    console.log('Issuing new token: ', renderSessionToken);

    const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

    res.cookie('session_id', renderSessionToken, {
        domain: isProd ? '.loregraded.com' : undefined, 
        httpOnly: true,
        secure: true, 
        sameSite: 'none', 
        path: '/'
    }).status(200);

    res.status(200).json({ success: true, token: renderSessionToken });
  } 
  catch (error) {
    res.status(401).json({ error: 'Tampered or expired cross-service token' });
  }

}


//----------------------------------------------------


export async function submitOrderToQueue (req: Request, res: Response)  
{
  const { user_id, order_id, queue_timestamp } = req.body;

  if (!user_id || !order_id) {
    console.error('submitOrderToQueue :: Denied - Missing user_id or order_id in request body');
    return res.status(400).send('Bad Request: user_id and order_id are required.');
  }
  else   
    console.log('Submitting order: ', order_id);
console.log(req._id);
  try {                  
    const order: Order = { user_id, order_id, time_stamp: queue_timestamp };
    const projection = { email: 1, phone: 1 };
    const account = await Database.findOneAndUpdate(process.env.MONGODB_COLLECTION as string, { _id: req._id }, { order }, projection);

    if (account) {
      sendNotification(account, 'submit');
      res.redirect(302, `${ process.env.WEB_URL as string }`);
    }
    else 
      res.status(302).send('Failed to associate account with queue.');
  }
  catch (error) {
    console.error('submitOrder::Error: ', error);
    res.status(500).send('Internal Server Error');
  }
}


//----------------------------------------------------


export async function purchaseGames (req: Request, res: Response)  
{
  console.log('purchaseGames: ', req.body);

  if (!req._id) {
    console.error('purchaseGames :: Denied - Unauthorized request or missing ID');
    res.status(401).send('Unauthorized.');
    return;
  }

  if (!req.body || !req.body.order_id) {
    console.error('purchaseGames :: Denied - Missing order_id in request body');
    return res.status(400).send('Bad Request: order_id is required.');
  }

  try {                  
    const games = { 
      castleWar: req.body.castleWar, 
      sovereignHeist: req.body.sovereignHeist, 
      shardDuel: req.body.shardDuel 
    }; 

    const projection = { email: 1, phone: 1 };

    const account = await Database.findOneAndUpdate(
      process.env.MONGODB_COLLECTION as string, 
      { _id: req._id }, 
      { games }, 
      projection
    );

    if (account) {
      sendNotification(account, 'submit');
      res.redirect(302, `${ process.env.WEB_URL as string }`);
    }
  }
  catch (error) {
    console.error('purchaseGames::Error: ', error);
    res.status(500).send('Internal Server Error');
  }
}


//-----------------------------------------------



export async function checkout (account: Account)
{ 
  try { 
    
    if (account)
    {
      const metadata = {
        recipient: account.email ?? null,
        email: account.email ?? null,
        phone: account.phone ?? null
      }

      const price = 100; //one dollar placeholder

      const stripeSession = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          success_url: `${ process.env.WEB_URL }/checkout-success`, 
          cancel_url: process.env.WEB_URL,
          line_items: [
            {
              price_data: { 
                currency: 'usd',
                product_data: { name: 'loregraded' },
                unit_amount: price,
              },

              //price: 'price_1N234567890',
              quantity: 1
            }
          ],
          metadata
      });

      console.log( 
        'Checkout Success Link Generated: ', stripeSession.url, 
        '\nTotal: ', price, 
        '\nMetadata: ', JSON.stringify(account)
      );
        
      return stripeSession.url;
    }
    else 
      console.log('Please create an account before checking out.');
  } 
  catch (error) {
    console.error('checkout::Error: ', error);
  }
}


//----------------------------------


export async function checkoutPaymentHook (req: Request, res: Response) 
{ 
  try {

    const event = req.body, 
          webhookSession: Account = JSON.parse(event.data.object.metadata[0]); 
    
    const _id = webhookSession._id;
    const projection = { email: 1 };

    switch (event.type) 
    {
      case 'checkout.session.completed':
      {
        const account = await Database.findOneAndUpdate(
          process.env.MONGODB_COLLECTION as string,
          { _id }, 
          projection, 
          { paid: true }
        );

        if (account)
        {
          console.log(`user: ${ account.email } paid. Sending notification.`);
            
          //send confirmation email / SMS

          sendNotification(webhookSession, 'purchase.complete');
        }
      }
      break;

      default: console.log(`Unhandled event type: ${ event.type }`); 
      break;
    }
  }

  catch(error) {
    console.error('checkoutPaymentHook::Error: ', error);
  }

  res.json({ received: true });
}



//--------------------------------------------------



export async function gamePaymentHook (req: Request, res: Response) 
{ 
  try {

    const event = req.body, 
          webhookSession: Account = JSON.parse(event.data.object.metadata[0]); 
    
    const _id = webhookSession._id;
    const projection = { email: 1 };

    switch (event.type) 
    {
      case 'checkout.session.completed':
      {
        const account = await Database.findOneAndUpdate(
          process.env.MONGODB_COLLECTION as string,
          { _id }, 
          projection, 
          { paid: true }
        );

        if (account)
        {
          console.log(`user: ${ account.email } paid. Sending notification.`);
            
          //send confirmation email / SMS

          sendNotification(webhookSession, 'purchase.complete');
        }
      }
      break;

      default: console.log(`Unhandled event type: ${ event.type }`); 
      break;
    }
  }

  catch(error) {
    console.error('gamePaymentHook::Error: ', error);
  }

  res.json({ received: true });
}




