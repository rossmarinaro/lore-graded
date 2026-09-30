import express, { Request, Response, NextFunction } from 'express'
import { Database } from '../database'
import { ObjectId } from 'mongodb'

const app = express();
const PORT = process.env.PORT || 3000;

async function rateLimiter(req: Request, res: Response, next: NextFunction) 
{
    try {
        const WINDOW_MS = 60 * 1000,
              MAX_LIMIT = 10,
              now = new Date(),
              result = await Database.client.db(process.env.MONGODB_DATABASE).collection('temp').findOneAndUpdate(
                { _id: new ObjectId(req.ip) }, 
                { $inc: { count: 1 },
                $setOnInsert: { resetAt: new Date(now.getTime() + WINDOW_MS) }
              }, 
              { returnDocument: 'after', upsert: true }
            ),
            record = result,
            remaining = Math.max(0, MAX_LIMIT - record?.count),
            resetTimeSec = Math.ceil((record?.resetAt.getTime() - now.getTime() / 1000));

        res.setHeader('X-RateLimit-Limit', MAX_LIMIT);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', record?.resetAt.toISOString());

        //deny access if limit exceeded

        if (record?.count > MAX_LIMIT)
        {
            res.setHeader('Retry-After', resetTimeSec);
            return res.status(429).json({
                status: 'fail',
                message: 'Too Many Requests',
                retryAfterSeconds: resetTimeSec
            });
        }

        next();
    }
    catch(error) {
        console.log('rate limit error: ', error);
    }
}

export { express, app, PORT, rateLimiter };