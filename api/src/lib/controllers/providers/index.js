import koa from 'koa';
import route from 'koa-route';
import bodyParser from 'koa-bodyparser';

import { list, find, register, load, del, check } from './actions';

const app = koa();

app.use(bodyParser());
app.use(route.get('/check', check));
app.use(route.get('/', list));
app.use(route.get('/:providerName', find));
app.use(route.delete('/:providerName', del));
app.use(route.put('/:providerName', register));
app.use(route.post('/:providerName', load));

export default app;
