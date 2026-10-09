
require('dotenv').config();

import { Database } from '../database'
import { Request, Response } from 'express'
import { AuthenticatedRequest, Order, SyncRequestBody, User} from '../types'
import { sendNotification } from '../notification'
import { getUserID } from '../utils';
import { AnyBulkWriteOperation } from 'mongodb';
import { stripe } from '../stripe';


//----------------------------------------------------


export async function logout (_req: Request, res: Response) 
{
  try {
    res.clearCookie('session_token', {
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


export async function syncUsers(req: AuthenticatedRequest, res: Response)
{ 
  try 
  {
    const { collection, documents } = req.body as SyncRequestBody;

    if (!collection || !Array.isArray(documents)) {
      res.status(400).json({ error: `Invalid payload layout. 'collection' and 'documents' are required.` });
      return;
    }
    
    const dbCollection = Database.client.db(process.env.MONGODB_DATABASE).collection(collection);

    //Build flexible operations depending on what data actually arrived

    const bulkOps: AnyBulkWriteOperation[] = documents.map(doc => {

      const sqlId = doc.metadata?.originalSqlId;

      if (sqlId !== undefined && sqlId !== null) {
        // If an ID exists, update an existing record or insert a new one
        return {
          updateOne: {
            filter: { 'metadata.originalSqlId': sqlId },
            // ✅ Removed the backslash completely. Native operator is cleanly declared.
            update: { $set: doc }, 
            upsert: true
          }
        };
      } 
      else // Fallback: If no ID was found, just blindly insert
        return {
          insertOne: { document: doc }
        };
    });

    if (bulkOps.length === 0) {
      res.json({ status: 'Success', message: 'No documents provided to write.' });
      return;
    }

    // Execute the database modifications in a single high-performance pipeline roundtrip
    const result = await dbCollection.bulkWrite(bulkOps, { ordered: false });
    
    res.json({ 
      status: 'Success', 
      matched: result.matchedCount, 
      upserted: result.upsertedCount,
      inserted: result.insertedCount
    });
  } 
  catch (err) {
    console.error('❌ Synchronization backend error:', err);
    res.status(500).send({ error: 'Internal Server Error' });
  }
}


//----------------------------------------------------


export async function submitOrderToQueue (req: AuthenticatedRequest, res: Response)  
{
  console.log('submitOrder: ', req.body);

  if (!req.body || !req.body.order_id) {
    console.error('submitOrderToQueue :: Denied - Missing order_id in request body');
    return res.status(400).send('Bad Request: order_id is required.');
  }

  try 
  {                  
   // if (!order.cards.length)
   //   res.status(400).send('No cards in order.');
  //  else 
    {
      const order: Order = { 
        order_id: req.body.order_id, 
        time_stamp: new Date() 
      };

      const projection = { email: 1, phone: 1 };

      const account = await Database.findOneAndUpdate(
        process.env.MONGODB_COLLECTION as string, 
        { _id: getUserID(req._id) }, 
        { order }, 
        projection
      );

      if (account)
      {
        //todo: handle submitting order

        sendNotification(account, 'submit');

        res.redirect(302, `${ process.env.WEB_URL as string }`);
      }
    }
  }
  catch (error) {
    console.error('submitOrder::Error: ', error);
    res.status(500).send('Internal Server Error');
  }
}


//-----------------------------------------------



export async function checkout (req: AuthenticatedRequest, res: Response) 
{ 
  if (!req._id) {
    console.error('checkout :: Denied - req._id is undefined');
    return res.status(401).send('Unauthorized: User session missing.');
  }

  try { 
    
    const projection = { email: 1, phone: 1 };

    const account = await Database.findOne(
      process.env.MONGODB_COLLECTION as string,
      { _id: getUserID(req._id) }, 
      projection
    );

    if (account)
    {
      const metadata = {
        recipient: req.body.recipient ?? null,
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
        
      res.status(200).send(stripeSession.url);
    }
    else 
      res.status(401).send('Please create an account before checking out.');
  } 
  catch (error) {
    console.error('checkout::Error: ', error);
    res.status(500).send('Internal Server Error');
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
        const projection = { email: 1 };

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

      break;

      default: console.log(`Unhandled event type: ${ event.type }`); 
      break;
    }
  }

  catch(error) {
    console.error('webhook::Error: ', error);
  }

  res.json({ received: true });
}


