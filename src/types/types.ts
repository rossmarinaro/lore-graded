import { ObjectId } from 'mongodb';
import Stripe from 'stripe'

export interface MongoDBOptions {
  maxPoolSize: number;
  minPoolSize: number;
  maxIdleTimeMS: number;
} 

export interface Order {
  user_id: string;
  order_id: string; 
  time_stamp: string | number | null;
  line_items: Stripe.Checkout.SessionCreateParams.LineItem[];
};

export interface SyncRequestBody {
  collection: string;
  documents: Array<{
    metadata: {
      originalSqlId: any;
      syncedAt: string;
      inferredIdKey: string;
    };
    data: Record<string, any>;
  }>;
}

export interface Account {
  _id?: ObjectId;
  email?: string;
  password?: string;
  phone?: string;
  paid?: boolean;
  orders?: Order[];
};

export interface StripeCardSubmission {
  price_data: { 
      currency: string;
      product_data: {
        name: string;
        metadata: Object;
      },
      unit_amount: number | string;
  },
  quantity: number;
}

export type EmailContextType = 'submit' | 'purchase.complete' | 'purchase.offered';
