import koa from 'koa';
import route from 'koa-route';

import { generateToken, getUser } from './auth';

const app = koa();

app.use(route.get('/', getUser));
app.use(route.get('/token', generateToken));

export default app;
