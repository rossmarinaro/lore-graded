import { express, app, PORT, rateLimiter } from './config/express'
import { Request, Response } from 'express'
import { router } from './endpoints';

// Middleware to parse JSON bodies
app.use(express.json());

app.get('./app/', rateLimiter);

app.use('/api', router);

// Sample Route with typed request and response parameters
app.get('/test', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from Express with TypeScript!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
