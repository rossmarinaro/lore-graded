//import path from 'path'
import { express, app, PORT, rateLimiter } from './config/express'
import { endpointRouter } from './routes/endpoints';
import { Database } from './database';

app.use(express.json());
app.get('./app/', rateLimiter);
app.use('/api', endpointRouter);

//serve files
//app.use(express.static(path.join(__dirname, '../public')));

Database.init().then(() => {
  app.listen(PORT, () => console.log(`Server is running on http://localhost:${ PORT }`));
})
.catch(err => {
  console.error(err);
  process.exit(-1);
});