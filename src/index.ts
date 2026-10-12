require('dotenv').config();

//import path from 'path'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import express, { Request, Response } from 'express'

import { Database } from './database'
import { authRouter } from './routes/auth';
import { main } from './main';
import { verifyAuth } from './verification';
import { apiRouter } from './routes/api';
import { rateLimiter } from './rateLimiter';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: [ process.env.WEB_URL as string, process.env.API_URL as string], credentials: true }));
app.use('./app/', rateLimiter);
app.use('/api2/auth', authRouter);
app.use('/api2/api', verifyAuth, apiRouter);

//serve files
//app.use(express.static(path.join(__dirname, '../test')));

app.get('/', (_req: Request, res: Response) => res.status(200).send('Welcome to Loregraded'));

Database.init().then(() => app.listen(PORT, () => {
  console.log(`Server is running on port: ${ PORT }`);
  main();
}))
.catch(err => {
  console.error(err);
  process.exit(-1);
});


