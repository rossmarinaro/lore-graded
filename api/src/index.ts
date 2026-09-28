import { app, PORT } from './config/express'
import express, { Request, Response } from 'express'

// Middleware to parse JSON bodies
app.use(express.json());

// Sample Route with typed request and response parameters
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Express with TypeScript!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
