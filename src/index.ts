require('dotenv').config();

//import path from 'path'
import cors from 'cors'

import { express, app, PORT, rateLimiter } from './express'
import { endpointRouter } from './endpoints';
import { Database } from './database';
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import { main } from './main';

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: [ process.env.WEB_URL as string, process.env.API_URL as string], credentials: true }));
app.use('./app/', rateLimiter);
app.use('/api2', endpointRouter);

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


