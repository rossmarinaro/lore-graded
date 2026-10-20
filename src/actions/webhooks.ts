import { Request, Response } from 'express'
import { Account } from '../types/types';
import { Database } from '../database';
import { sendNotification } from '../notification';
import { stripe } from '../stripe';
import Stripe from 'stripe';

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
            //todo: notify processing center about the order.

            console.log(`user: ${ account.email } paid. Sending notification.`);
            
            //send confirmation email / SMS

            const to = sendNotification(webhookSession, 'purchase.complete');
            console.log('Successfully sent notifications to: ', to);
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

    const session = event.data.object as Stripe.Checkout.Session;

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'], 
    });

    const itemsPayload = lineItems.data.map(item => {
        const product = item.price?.product as Stripe.Product;
        
        return {
            // If you passed your database ID in metadata during checkout creation:
            itemId: product.metadata?.databaseId || item.price?.id, 
            stripeProductId: product.id,
            name: item.description,
            quantity: item.quantity || 1,
            amountCents: item.amount_total,
        };
    });

    console.log('items payload: ', itemsPayload);

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



