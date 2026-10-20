require('dotenv').config();

import jwt from 'jsonwebtoken'
import { Database, sqlPool } from '../database'
import { Request, Response } from 'express'
import { sendNotification } from '../notification'
import { getUserID } from '../utils';
import { StripeCardSubmission } from '../types/types';


//----------------------------------------------------


export async function logout (_req: Request, res: Response) 
{
  try {
    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none'
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

    console.log('Syncing user...');

    //verify that frontend-backend (gpt site) signed this token

    const decoded = jwt.verify(syncToken, process.env.CROSS_SERVICE_SECRET) as jwt.JwtPayload;

    //console.log("Keys inside this token:", Object.keys(decoded));

    const user = await Database.findOneAndUpdate(process.env.MONGODB_COLLECTION as string, { email: decoded.email }, {}, {}, true); 

    //SESSION: Generate a standard session token for subsequent Render operations

    if (!user) {
      res.status(401).json({ error: 'Problem accessing database.' });
      return;
    }

    const renderSessionToken = jwt.sign({ userId: user._id }, process.env.CROSS_SERVICE_SECRET, { expiresIn: '30d' });

    console.log('Issuing new token: ', renderSessionToken);

    const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

    //return cookies

    res.cookie('session_id', renderSessionToken, {
        domain: isProd ? '.loregraded.com' : undefined, 
        httpOnly: true,
        secure: true, 
        sameSite: 'none', 
        path: '/'
    }).status(200);

    //return token

    res.status(200).json({ success: true, token: renderSessionToken });
  } 
  catch (error) {
    res.status(401).json({ error: 'Tampered or expired cross-service token' });
  }

}


//----------------------------------------------------


export async function submitOrderToQueue (req: Request, res: Response)  
{
  const { 
    user_id, 
    order_id, 
    queue_timestamp,
    phone,
    recipient,
    street,
    apartment,
    city,
    zip,
    state,
    country 
  } = req.body;

  if (!user_id || !order_id) {
    console.error('submitOrderToQueue :: Denied - Missing user_id or order_id in request body');
    return res.status(400).send('Bad Request: user_id and order_id are required.');
  }
  else   
    console.log('Submitting order: ', order_id);

  try {    

    //fetch the product

    const sqlQuery = ''; //todo, ask for the actual sql product fields by its order_id
    const queryValues = ['active'];
    const sqlResult = await sqlPool.query(sqlQuery, queryValues);
    const products = sqlResult.rows;

    if (!products) {
      console.log('Product not found.');
      return;
    }
    
    //submit order to queue, enter in database

    //temp product data TODO: look up actual mapped prices to card submissions

    const line_items: StripeCardSubmission[] = [];

    products.forEach(i => {
      line_items.push({
        price_data: { 
          currency: i.currency,
          product_data: {
              name: i.id,
              metadata: {
                
                //todo: add mapped data for card submissions
              }
          },
          unit_amount: i.price //100, //one dollar placeholder
        },
        quantity: 1
      });
    });

    const order = { user_id, order_id, line_items, time_stamp: queue_timestamp };
    const id = req.id?.toString(); 

    if (!id) 
      return;

    const updateParams = { phone, recipient, street, apartment, city, zip, state, country, order };

    const projection = { email: 1, phone: 1 };  
    const account = await Database.findOneAndUpdate(process.env.MONGODB_COLLECTION as string, { _id: getUserID(id) }, updateParams, projection);

    //send notifications

    if (account) { 
      res.status(200).send(`Order ${ order_id } added to the queue.`);
      const to = await sendNotification(account, 'submit');
      console.log('Successfully sent notifications to: ', to);
    }
    else {
      console.log('Failed to associate order to queue.');
      res.status(302).send('Failed to associate account with order queue.'); 
    }
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

  if (!req.id) {
    console.error('purchaseGames :: Denied - Unauthorized request or missing ID');
    res.status(401).send('Unauthorized.');
    return;
  }

  const { 
    castleWar, 
    sovereignHeist, 
    shardDuel, 
    order_id } = req.body;

  if (!order_id || !castleWar || !sovereignHeist || !shardDuel) {
    console.error('purchaseGames :: Denied - Missing order_id in request body');
    return res.status(400).send('Bad Request: order_id is required.');
  }

  try {                  

    //temp product data

    // const line_items = [
    //     {
    //       price_data: { 
    //           currency: 'usd',
    //           product_data: {
    //               name: 'loregraded',
    //               metadata: {
    //                 castleWar, sovereignHeist, shardDuel
    //               }
    //           },
    //           unit_amount: 100, //one dollar placeholder
    //       },
          
    //       //price: 'price_1N234567890',
    //       quantity: 1
    //     }
    // ];

    // const projection = { email: 1, phone: 1 };

    // const account = await Database.findOneAndUpdate(
    //   process.env.MONGODB_COLLECTION as string, 
    //   { _id: req.id }, 
    //   { line_items }, 
    //   projection
    // );

    // if (account) 
    // {
    //   //handle stripe url to send back

    //   const stripeUrl = await checkout(account, process.env.GAMES_URL as string);

    //   if (!stripeUrl) {
    //     console.log('There was a problem issuing a stripe checkout link.');
    //     return;
    //   }

    //   console.log('Checkout Success Link Generated: ', stripeUrl, '\nMetadata: ', JSON.stringify(account));

    //   res.status(200).send({ url: stripeUrl });
    //   //sendNotification(account, 'submit');

    // }
  }
  catch (error) {
    console.error('purchaseGames::Error: ', error);
    res.status(500).send('Internal Server Error');
  }
}






