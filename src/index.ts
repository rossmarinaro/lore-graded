require('dotenv').config();

//import path from 'path'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import schedule from 'node-schedule';
import express, { Request, Response } from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import { Database } from './database';
import { authRouter } from './routes/auth';
import { verifyAuth } from './verification';
import { apiRouter } from './routes/api';
import { rateLimiter } from './rateLimiter';
import { webhookRouter } from './routes/webhooks';
import { sendTargetedNotifications } from './notification';
import { syncUser } from './actions/main';

const app = express();
const PORT = process.env.PORT || 3000;

app.enable('trust proxy'); 
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_fallback_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_ATLAS_URI, // Your database connection string
    ttl: 14 * 24 * 60 * 60 // Sessions expire in 14 days
  }),
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(cors({ origin: [ process.env.WEB_URL as string, process.env.API_URL as string], credentials: true }));
app.use('./app/', rateLimiter);
app.use('/webhooks', webhookRouter);
app.use('/api2/auth', authRouter);
app.use('/api2/api', verifyAuth, apiRouter);
app.post('/api2/sync-user', syncUser);
//serve files
//app.use(express.static(path.join(__dirname, '../test')));

app.get('/', (_req: Request, res: Response) => res.status(200).send('Welcome to Loregraded'));

//start database and run application

Database.init().then(() => app.listen(PORT, () => {

  //schedule for Sunday at 7:45 PM (15 minutes before 8:00 PM)
  //Cron format: minute hour day-of-month month day-of-week

  const rule = '45 19 * * 0'; 

  const job = schedule.scheduleJob('sunday-drop-cron', rule, () => {
    console.log(`Scheduled job: ${ job.name } completed. Restarting clock...`);
    sendTargetedNotifications();
  });

  console.log(`Server is running on port: ${ PORT }. Scheduled job: ${ job.name } initiated.`);
}))
.catch(err => {
  console.error(err);
  process.exit(-1);
});