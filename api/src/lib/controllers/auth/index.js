import koa from 'koa';
import route from 'koa-route';
import bodyParser from 'koa-bodyparser';

import { updatePassword, resetPassword, getToken, getUser } from './auth';

const app = koa();

app.use(route.get('/', getUser));
app.use(route.get('/token', getToken));
app.use(bodyParser());
app.use(route.put('/password', updatePassword));
app.use(route.put('/password/reset', resetPassword));

export default app;
