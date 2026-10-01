import path from 'path'
import { express, app, PORT, rateLimiter } from './config/express'
import { Request, Response } from 'express'
import { router } from './endpoints';
import { Database } from './database';

// Middleware to parse JSON bodies
app.use(express.json());

app.get('./app/', rateLimiter);

app.use('/api', router);

app.use(express.static(path.join(__dirname, '../public')));

// Sample Route with typed request and response parameters
app.get('/test', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from Express with TypeScript!' });
});

Database.init().then(() => {
  app.listen(PORT, () => console.log(`Server is running on http://localhost:${ PORT }`));
})
.catch(err => {
  console.error(err);
  process.exit(-1);
});