import koa from 'koa';
import route from 'koa-route';

import { getToken, getUser } from './auth';

const app = koa();

app.use(route.get('/', getUser));
app.use(route.get('/token', getToken));

export default app;
