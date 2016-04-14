import koa from 'koa';
import route from 'koa-route';

import list from './list';
import upload from './upload';

const app = koa();


app.use(route.get('/', list));
app.use(route.post('/:orgName', upload));

export default app;
