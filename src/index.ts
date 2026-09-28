import { express, app, PORT } from './config/express'
import { Request, Response } from 'express'
import { router } from './endpoints';

app.use('/api', router);

// Middleware to parse JSON bodies
app.use(express.json());

// Sample Route with typed request and response parameters
app.get('/test', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from Express with TypeScript!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
